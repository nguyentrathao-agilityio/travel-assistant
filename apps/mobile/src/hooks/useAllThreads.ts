import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

// Services
import { fetchThreadsPage } from '../services';

// Constants
import { THREAD_LIST_STATUS, THREAD_PAGE_SIZE } from '../constants';

// Hooks
import { threadQueryKeys } from './threadQueryKeys';

// Types
import type { ThreadItem } from '../services';

const dedupeThreads = (pages: ThreadItem[][]): ThreadItem[] => {
  const seen = new Set<string>();

  return pages.flat().filter((thread) => {
    if (seen.has(thread.id)) return false;
    seen.add(thread.id);

    return true;
  });
};

export const useAllThreads = () => {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    getNextPageParam: (lastPage: ThreadItem[], allPages: ThreadItem[][]) =>
      lastPage.length === THREAD_PAGE_SIZE ? dedupeThreads(allPages).length : undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchThreadsPage(THREAD_PAGE_SIZE, pageParam),
    queryKey: threadQueryKeys.list(),
  });

  const hasCachedData = query.data !== undefined;
  const syncFailed = query.isError && hasCachedData;
  const status = query.isPending
    ? THREAD_LIST_STATUS.LOADING
    : query.isError && !hasCachedData
      ? THREAD_LIST_STATUS.ERROR
      : THREAD_LIST_STATUS.READY;

  const removeThread = (threadId: string) => {
    queryClient.setQueryData<InfiniteData<ThreadItem[]>>(
      threadQueryKeys.list(),
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) => page.filter((thread) => thread.id !== threadId)),
        }
    );
  };

  const renameThread = (threadId: string, title: string) => {
    queryClient.setQueryData<InfiniteData<ThreadItem[]>>(
      threadQueryKeys.list(),
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) =>
            page.map((thread) => (thread.id === threadId ? { ...thread, title } : thread))
          ),
        }
    );
  };

  return {
    fetchMore: query.fetchNextPage,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMoreFailed: query.isFetchNextPageError,
    refresh: query.refetch,
    removeThread,
    renameThread,
    status,
    syncFailed,
    threads: query.data ? dedupeThreads(query.data.pages) : [],
  };
};
