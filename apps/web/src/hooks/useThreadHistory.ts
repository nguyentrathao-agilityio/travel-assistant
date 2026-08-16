import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { langgraphClient } from '@/lib';
import { useThreadStore } from '@/stores';
import { isCurrentThread, toAgUiMessage } from '@/utils';

import type { AgUiMessage } from '@/types';
import type { LangGraphThreadValues } from '@/utils';

interface ThreadHistoryState {
  threadId: string;
  messages: AgUiMessage[];
  isLoading: boolean;
  error: Error | null;
}

export type ThreadHistoryResult = Omit<ThreadHistoryState, 'threadId'>;

type ThreadHistoryResponse = Awaited<
  ReturnType<typeof langgraphClient.threads.get<LangGraphThreadValues>>
>;

// React StrictMode mounts effects twice in development. Share only requests
// that are currently in flight; revisions still receive independent keys.
const inFlightThreadHistory = new Map<string, Promise<ThreadHistoryResponse>>();

const getThreadHistory = (threadId: string, revision: number): Promise<ThreadHistoryResponse> => {
  const key = `${threadId}:${revision}`;
  const existing = inFlightThreadHistory.get(key);
  if (existing) return existing;

  const request = langgraphClient.threads.get<LangGraphThreadValues>(threadId);
  const sharedRequest = request.finally(() => {
    if (inFlightThreadHistory.get(key) === sharedRequest) inFlightThreadHistory.delete(key);
  });
  inFlightThreadHistory.set(key, sharedRequest);
  return sharedRequest;
};

// Stable reference — a fresh [] here would change identity on every render this fires in,
// re-triggering effects that depend on `messages` and looping.
const EMPTY_MESSAGES: AgUiMessage[] = [];

const emptyHistory = (threadId: string, isLoading: boolean): ThreadHistoryState => ({
  threadId,
  messages: EMPTY_MESSAGES,
  isLoading,
  error: null,
});

/**
 * Loads the latest persisted message snapshot for a LangGraph thread.
 *
 * The state is tagged with its thread ID so a late response from the previous
 * thread can never be rendered after the user switches conversations.
 */
export const useThreadHistory = (threadId: string): ThreadHistoryResult => {
  const threadRevision = useThreadStore((state) => state.activeThreadRevision);
  const [history, setHistory] = useState<ThreadHistoryState>(() =>
    emptyHistory(threadId, Boolean(threadId))
  );

  useEffect(() => {
    if (!threadId) {
      setHistory(emptyHistory(threadId, false));
      return;
    }

    let isCurrentRequest = true;
    setHistory(emptyHistory(threadId, true));

    getThreadHistory(threadId, threadRevision)
      .then((thread) => {
        if (!isCurrentRequest) return;

        const messages = (thread.values?.messages ?? []).flatMap((message, index) => {
          const convertedMessage = toAgUiMessage(message, `${threadId}:${index}`);
          return convertedMessage ? [convertedMessage] : [];
        });

        setHistory({ threadId, messages, isLoading: false, error: null });
      })
      .catch((error: Error) => {
        if (!isCurrentRequest) return;

        const isMissingThread = error.message.toLowerCase().includes('not found');
        setHistory({
          threadId,
          messages: [],
          isLoading: false,
          error: isMissingThread ? null : error,
        });

        if (!isMissingThread) {
          toast.error('Failed to load chat history. Please try again.');
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [threadId, threadRevision]);

  // Effects run after paint. Never expose history belonging to the previous
  // thread during that gap.
  if (!isCurrentThread(history.threadId, threadId)) {
    return emptyHistory(threadId, Boolean(threadId));
  }

  return history;
};
