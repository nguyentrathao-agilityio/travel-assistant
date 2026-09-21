import { useCallback, useEffect, useState } from 'react';

// Constants
import { THREAD_LIST_STATUS } from '../constants';

// Services
import { fetchRecentThreads } from '../services';

// Types
import type { ThreadItem } from '../services';

type RecentThreadsState =
  | { status: typeof THREAD_LIST_STATUS.LOADING; threads: [] }
  | { status: typeof THREAD_LIST_STATUS.READY; threads: ThreadItem[] }
  | { status: typeof THREAD_LIST_STATUS.ERROR; threads: [] };

export const useRecentThreads = (limit?: number) => {
  const [state, setState] = useState<RecentThreadsState>({
    status: THREAD_LIST_STATUS.LOADING,
    threads: [],
  });

  const refresh = useCallback(() => {
    setState({ status: THREAD_LIST_STATUS.LOADING, threads: [] });

    fetchRecentThreads(limit)
      .then((threads) => setState({ status: THREAD_LIST_STATUS.READY, threads }))
      .catch(() => setState({ status: THREAD_LIST_STATUS.ERROR, threads: [] }));
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Drops a deleted thread from the current list immediately, instead of waiting
  // on a full refetch, so the row disappears the moment deletion succeeds.
  const removeThread = useCallback((threadId: string) => {
    setState((current) =>
      current.status === THREAD_LIST_STATUS.READY
        ? {
            status: THREAD_LIST_STATUS.READY,
            threads: current.threads.filter((thread) => thread.id !== threadId),
          }
        : current
    );
  }, []);

  return { ...state, refresh, removeThread };
};
