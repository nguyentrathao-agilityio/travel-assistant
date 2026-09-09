import { useCallback, useEffect, useState } from 'react';

// Constants
import { THREAD_PAGE_SIZE } from '../constants';

// Services
import { fetchThreadsPage } from '../services';

// Types
import type { ThreadItem } from '../services';

interface AllThreadsState {
  status: 'loading' | 'ready' | 'error';
  threads: ThreadItem[];
  isLoadingMore: boolean;
  hasMore: boolean;
}

const INITIAL_STATE: AllThreadsState = {
  status: 'loading',
  threads: [],
  isLoadingMore: false,
  hasMore: false,
};

export const useAllThreads = () => {
  const [state, setState] = useState<AllThreadsState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setState({ ...INITIAL_STATE, status: 'loading' });

    fetchThreadsPage(THREAD_PAGE_SIZE, 0)
      .then((threads) =>
        setState({
          status: 'ready',
          threads,
          isLoadingMore: false,
          hasMore: threads.length === THREAD_PAGE_SIZE,
        })
      )
      .catch(() => setState({ ...INITIAL_STATE, status: 'error' }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fetchMore = useCallback(() => {
    setState((current) => {
      if (current.isLoadingMore || !current.hasMore || current.status !== 'ready') return current;

      fetchThreadsPage(THREAD_PAGE_SIZE, current.threads.length)
        .then((page) => {
          setState((latest) => {
            const existingIds = new Set(latest.threads.map((thread) => thread.id));

            return {
              ...latest,
              isLoadingMore: false,
              threads: [...latest.threads, ...page.filter((item) => !existingIds.has(item.id))],
              hasMore: page.length === THREAD_PAGE_SIZE,
            };
          });
        })
        .catch(() => setState((latest) => ({ ...latest, isLoadingMore: false })));

      return { ...current, isLoadingMore: true };
    });
  }, []);

  const removeThread = useCallback((threadId: string) => {
    setState((current) => ({
      ...current,
      threads: current.threads.filter((thread) => thread.id !== threadId),
    }));
  }, []);

  return { ...state, refresh, fetchMore, removeThread };
};
