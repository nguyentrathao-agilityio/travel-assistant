import { useCallback, useEffect, useState } from 'react';

// Services
import { fetchThreadsPage } from '../services';

// Constants
import { THREAD_LIST_STATUS, THREAD_PAGE_SIZE } from '../constants';

// Types
import type { ThreadListStatus } from '../constants';
import type { ThreadItem } from '../services';

interface AllThreadsState {
  status: ThreadListStatus;
  threads: ThreadItem[];
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMoreFailed: boolean;
}

const INITIAL_STATE: AllThreadsState = {
  status: THREAD_LIST_STATUS.LOADING,
  threads: [],
  isLoadingMore: false,
  hasMore: false,
  loadMoreFailed: false,
};

export const useAllThreads = () => {
  const [state, setState] = useState<AllThreadsState>(INITIAL_STATE);

  const refresh = useCallback(() => {
    setState({ ...INITIAL_STATE, status: THREAD_LIST_STATUS.LOADING });

    fetchThreadsPage(THREAD_PAGE_SIZE, 0)
      .then((threads) =>
        setState({
          status: THREAD_LIST_STATUS.READY,
          threads,
          isLoadingMore: false,
          hasMore: threads.length === THREAD_PAGE_SIZE,
          loadMoreFailed: false,
        })
      )
      .catch(() => setState({ ...INITIAL_STATE, status: THREAD_LIST_STATUS.ERROR }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fetchMore = useCallback(() => {
    setState((current) => {
      if (current.isLoadingMore || !current.hasMore || current.status !== THREAD_LIST_STATUS.READY)
        return current;

      fetchThreadsPage(THREAD_PAGE_SIZE, current.threads.length)
        .then((page) => {
          setState((latest) => {
            const existingIds = new Set(latest.threads.map((thread) => thread.id));

            return {
              ...latest,
              isLoadingMore: false,
              loadMoreFailed: false,
              threads: [...latest.threads, ...page.filter((item) => !existingIds.has(item.id))],
              hasMore: page.length === THREAD_PAGE_SIZE,
            };
          });
        })
        .catch(() =>
          setState((latest) => ({ ...latest, isLoadingMore: false, loadMoreFailed: true }))
        );

      return { ...current, isLoadingMore: true, loadMoreFailed: false };
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
