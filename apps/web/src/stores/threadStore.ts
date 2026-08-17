import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

import { langgraphClient } from '@/lib/langgraphClient';
import { useTripStateStore } from '@/stores/tripStateStore';
import { SESSION_STORAGE_KEY, AGENT_NAME, THREAD_PAGE_SIZE } from '@/constants';
import { ERROR_MESSAGES } from '@/constants/messages';
import { langgraphMessageText } from '@/utils';

import type { Thread, Message } from '@langchain/langgraph-sdk';

export interface ThreadItem {
  id: string;
  title: string | null;
  createdAt: string;
}

const GRAPH_ID = 'travel';

const firstHumanMessageText = (messages: Message[] | undefined): string | null => {
  for (const message of messages ?? []) {
    if (message.type !== 'human') continue;
    const text = langgraphMessageText(message.content).trim();

    if (text) return text;
  }

  return null;
};

const toThreadItem = (thread: Thread): ThreadItem => {
  const { messages } = (thread.values as { messages?: Message[] } | undefined) ?? {};

  return {
    id: thread.thread_id,
    title: firstHumanMessageText(messages),
    createdAt: thread.created_at,
  };
};

const searchThreadsPage = (limit: number, offset: number) =>
  langgraphClient.threads
    .search({
      metadata: { resourceId: AGENT_NAME },
      limit,
      offset,
      sortBy: 'created_at',
      sortOrder: 'desc',
    })
    .then((raw) => raw.map(toThreadItem));

/* Whether the active thread already exists on the server — checked independently of
 * the paginated list fetch, since a real (older) thread may simply live on a later page. */
const activeThreadExists = (threadId: string): Promise<boolean> =>
  langgraphClient.threads
    .get(threadId)
    .then(() => true)
    .catch(() => false);

interface ThreadStore {
  activeThreadId: string;
  activeThreadRevision: number;
  isResumed: boolean;
  threads: ThreadItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreThreads: boolean;
  isCreating: boolean;

  setActiveThreadId: (id: string, resumed?: boolean) => void;
  setThreads: (threads: ThreadItem[]) => void;
  updateThread: (threadId: string, updates: Partial<ThreadItem>) => void;

  fetchThreads: () => Promise<void>;
  fetchMoreThreads: () => Promise<void>;
  createThread: () => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  selectThread: (threadId: string) => void;
  refreshActiveThread: () => void;
}

const initialState = {
  activeThreadId: crypto.randomUUID(),
  activeThreadRevision: 0,
  isResumed: false,
  threads: [] as ThreadItem[],
  isLoading: true,
  isLoadingMore: false,
  hasMoreThreads: false,
  isCreating: false,
};

export const useThreadStore = create<ThreadStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setActiveThreadId: (id, resumed = false) => set({ activeThreadId: id, isResumed: resumed }),
      setThreads: (threads) => set({ threads }),
      updateThread: (threadId, updates) => {
        if (!get().threads.some((t) => t.id === threadId)) return;
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId ? { ...thread, ...updates } : thread
          ),
        }));
      },

      fetchThreads: async () => {
        // Load the first page and independently verify the persisted active thread.
        set({ isLoading: true });
        try {
          const currentThreadId = get().activeThreadId;
          const [items, activeExists] = await Promise.all([
            searchThreadsPage(THREAD_PAGE_SIZE, 0),
            activeThreadExists(currentThreadId),
          ]);

          if (!activeExists) {
            // Resume the newest server thread or initialize an empty server session.
            if (items.length > 0) {
              set({
                threads: items,
                activeThreadId: items[0].id,
                isResumed: true,
                hasMoreThreads: items.length === THREAD_PAGE_SIZE,
              });

              return;
            }

            // No threads on server — create one for the current session.
            await langgraphClient.threads.create({
              threadId: currentThreadId,
              graphId: GRAPH_ID,
              ifExists: 'do_nothing',
              metadata: { resourceId: AGENT_NAME },
            });
            items.unshift({
              id: currentThreadId,
              title: null,
              createdAt: new Date().toISOString(),
            });
          }

          set({ threads: items, hasMoreThreads: items.length >= THREAD_PAGE_SIZE });
        } catch {
          toast.error(ERROR_MESSAGES.LOAD_THREADS);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchMoreThreads: async () => {
        // Append the next page without duplicating threads already in local state.
        const { isLoadingMore, hasMoreThreads, threads } = get();

        if (isLoadingMore || !hasMoreThreads) return;

        set({ isLoadingMore: true });
        try {
          const items = await searchThreadsPage(THREAD_PAGE_SIZE, threads.length);
          const existingIds = new Set(threads.map((thread) => thread.id));

          set((state) => ({
            threads: [...state.threads, ...items.filter((item) => !existingIds.has(item.id))],
            hasMoreThreads: items.length === THREAD_PAGE_SIZE,
          }));
        } catch {
          toast.error(ERROR_MESSAGES.LOAD_THREADS);
        } finally {
          set({ isLoadingMore: false });
        }
      },

      createThread: async () => {
        // Reuse an existing empty draft before creating another server thread.
        if (get().isCreating) return;

        const { threads, activeThreadId } = get();
        const activeThread = threads.find((thread) => thread.id === activeThreadId);

        if (activeThread && (activeThread.title == null || activeThread.title === '')) {
          return;
        }

        const latestEmptyThread = threads
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .find((thread) => thread.title == null || thread.title === '');

        if (latestEmptyThread) {
          set({ activeThreadId: latestEmptyThread.id, isResumed: true });

          return;
        }

        // Optimistically expose the new conversation while the server record is created.
        const threadId = crypto.randomUUID();
        const newThread: ThreadItem = {
          id: threadId,
          title: null,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          isCreating: true,
          threads: [newThread, ...state.threads],
          activeThreadId: threadId,
          isResumed: false,
        }));

        try {
          await langgraphClient.threads.create({
            threadId,
            graphId: GRAPH_ID,
            ifExists: 'do_nothing',
            metadata: { resourceId: AGENT_NAME },
          });
        } catch {
          toast.error(ERROR_MESSAGES.CREATE_THREAD);
        } finally {
          set({ isCreating: false });
        }
      },

      deleteThread: async (threadId: string) => {
        // Snapshot state so a failed optimistic deletion can be rolled back.
        const { threads, activeThreadId } = get();
        const threadsSnapshot = threads;
        const isActive = threadId === activeThreadId;

        set((state) => ({ threads: state.threads.filter((thread) => thread.id !== threadId) }));
        useTripStateStore.getState().clearTripState(threadId);

        // If the deleted thread was active, switch to the next available one
        if (isActive) {
          const remainingThreads = threadsSnapshot.filter((thread) => thread.id !== threadId);
          const nextThreadId = remainingThreads[0]?.id ?? crypto.randomUUID();

          set({ activeThreadId: nextThreadId, isResumed: remainingThreads.length > 0 });
        }

        // Persist the deletion and restore the list if the server rejects it.
        try {
          await langgraphClient.threads.delete(threadId);
        } catch {
          set({ threads: threadsSnapshot });
          toast.error(ERROR_MESSAGES.DELETE_THREAD);
        }
      },

      selectThread: (threadId: string) => set({ activeThreadId: threadId, isResumed: true }),
      refreshActiveThread: () =>
        set((state) => ({ activeThreadRevision: state.activeThreadRevision + 1, isResumed: true })),
    }),
    {
      name: SESSION_STORAGE_KEY,
      partialize: (state) => ({ activeThreadId: state.activeThreadId }),
      onRehydrateStorage: () => (state) => {
        if (state?.activeThreadId) state.isResumed = true;
      },
    }
  )
);
