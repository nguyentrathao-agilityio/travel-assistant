import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { langgraphClient } from '@/lib';
import { useThreadStore } from '@/stores';
import { toAgUiMessage } from '@/utils';

import type { AgUiMessage } from '@/types';
import type { LangGraphThreadValues } from '@/utils';

interface ThreadHistoryState {
  threadId: string;
  messages: AgUiMessage[];
  isLoading: boolean;
  error: Error | null;
}

export type ThreadHistoryResult = Omit<ThreadHistoryState, 'threadId'>;

const emptyHistory = (threadId: string, isLoading: boolean): ThreadHistoryState => ({
  threadId,
  messages: [],
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

    langgraphClient.threads
      .get<LangGraphThreadValues>(threadId)
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
  if (history.threadId !== threadId) {
    return emptyHistory(threadId, Boolean(threadId));
  }

  return history;
};
