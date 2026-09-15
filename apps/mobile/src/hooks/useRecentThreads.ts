import { useCallback, useEffect, useState } from 'react';

// Services
import { fetchRecentThreads } from '../services';

// Types
import type { ThreadItem } from '../services';

type RecentThreadsState =
  | { status: 'loading'; threads: [] }
  | { status: 'ready'; threads: ThreadItem[] }
  | { status: 'error'; threads: [] };

export const useRecentThreads = (limit?: number) => {
  const [state, setState] = useState<RecentThreadsState>({ status: 'loading', threads: [] });

  const refresh = useCallback(() => {
    setState({ status: 'loading', threads: [] });

    fetchRecentThreads(limit)
      .then((threads) => setState({ status: 'ready', threads }))
      .catch(() => setState({ status: 'error', threads: [] }));
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Drops a deleted thread from the current list immediately, instead of waiting
  // on a full refetch, so the row disappears the moment deletion succeeds.
  const removeThread = useCallback((threadId: string) => {
    setState((current) =>
      current.status === 'ready'
        ? { status: 'ready', threads: current.threads.filter((thread) => thread.id !== threadId) }
        : current
    );
  }, []);

  return { ...state, refresh, removeThread };
};
