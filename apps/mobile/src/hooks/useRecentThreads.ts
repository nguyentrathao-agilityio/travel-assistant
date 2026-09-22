import { useQuery, useQueryClient } from '@tanstack/react-query';

// Services
import { fetchRecentThreads, RECENT_THREADS_LIMIT } from '../services';

// Constants
import { THREAD_LIST_STATUS } from '../constants';

// Hooks
import { threadQueryKeys } from './threadQueryKeys';

// Types
import type { ThreadItem } from '../services';

export const useRecentThreads = (limit: number = RECENT_THREADS_LIMIT) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryFn: () => fetchRecentThreads(limit),
    queryKey: threadQueryKeys.recent(limit),
  });

  const status = query.isPending
    ? THREAD_LIST_STATUS.LOADING
    : query.isError
      ? THREAD_LIST_STATUS.ERROR
      : THREAD_LIST_STATUS.READY;

  const removeThread = (threadId: string) => {
    queryClient.setQueryData<ThreadItem[]>(threadQueryKeys.recent(limit), (current) =>
      current?.filter((thread) => thread.id !== threadId)
    );
  };

  return { status, threads: query.data ?? [], refresh: query.refetch, removeThread };
};
