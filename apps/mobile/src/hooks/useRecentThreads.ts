import { useCallback, useEffect, useState } from 'react';

import { fetchRecentThreads } from '../services';

import type { ThreadItem } from '../services';

type RecentThreadsState =
  | { status: 'loading'; threads: [] }
  | { status: 'ready'; threads: ThreadItem[] }
  | { status: 'error'; threads: [] };

export const useRecentThreads = () => {
  const [state, setState] = useState<RecentThreadsState>({ status: 'loading', threads: [] });

  const refresh = useCallback(() => {
    setState({ status: 'loading', threads: [] });

    fetchRecentThreads()
      .then((threads) => setState({ status: 'ready', threads }))
      .catch(() => setState({ status: 'error', threads: [] }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
};
