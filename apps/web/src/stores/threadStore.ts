import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

import { langgraphClient } from '@/lib/langgraphClient';
import { useTripStateStore } from '@/stores/tripStateStore';
import { SESSION_STORAGE_KEY, AGENT_NAME } from '@/constants';
import { ERROR_MESSAGES } from '@/constants/messages';

import type { Thread } from '@langchain/langgraph-sdk';

export interface ThreadItem {
  id: string;
  title: string | null;
  createdAt: string;
}

const GRAPH_ID = 'travel';

const toThreadItem = (thread: Thread): ThreadItem => ({
  id: thread.thread_id,
  title: typeof thread.metadata?.title === 'string' ? thread.metadata.title : null,
  createdAt: thread.created_at,
});

interface ThreadStore {
  activeThreadId: string;
  isResumed: boolean;
  threads: ThreadItem[];
  isLoading: boolean;
  isCreating: boolean;

  setActiveThreadId: (id: string, resumed?: boolean) => void;
  setThreads: (threads: ThreadItem[]) => void;
  updateThread: (threadId: string, updates: Partial<ThreadItem>) => void;

  fetchThreads: () => Promise<void>;
  createThread: () => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  selectThread: (threadId: string) => void;
}

const initialState = {
  activeThreadId: crypto.randomUUID(),
  isResumed: false,
  threads: [] as ThreadItem[],
  isLoading: false,
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
        set({ isLoading: true });
        try {
          const rawThreads = await langgraphClient.threads.search({
            metadata: { resourceId: AGENT_NAME },
            limit: 100,
          });

          const items = rawThreads.map(toThreadItem);

          const currentThreadId = get().activeThreadId;
          const isActiveMissing =
            currentThreadId && !items.find((item) => item.id === currentThreadId);

          if (isActiveMissing) {
            if (items.length > 0) {
              items.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              set({ threads: items, activeThreadId: items[0].id, isResumed: true });
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

          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          set({ threads: items });
        } catch {
          toast.error(ERROR_MESSAGES.LOAD_THREADS);
        } finally {
          set({ isLoading: false });
        }
      },

      createThread: async () => {
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

        try {
          await langgraphClient.threads.delete(threadId);
        } catch {
          set({ threads: threadsSnapshot });
          toast.error(ERROR_MESSAGES.DELETE_THREAD);
        }
      },

      selectThread: (threadId: string) => set({ activeThreadId: threadId, isResumed: true }),
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
