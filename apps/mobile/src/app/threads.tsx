import { useRouter } from 'expo-router';
import { useCallback } from 'react';

// Constants
import { CHAT_PATH, DASHBOARD_PATH } from '../constants';

// Components
import { AllTripsScreen } from '../screens';

// Hooks
import {
  useActiveThreadId,
  useAllThreads,
  useStartNewTrip,
  useThreadDeletion,
  useThreadRename,
} from '../hooks';

export default function ThreadsRoute() {
  const router = useRouter();
  const {
    status,
    threads,
    isLoadingMore,
    hasMore,
    loadMoreFailed,
    syncFailed,
    fetchMore,
    refresh,
    removeThread,
    renameThread,
  } = useAllThreads();
  const { markActive } = useActiveThreadId();
  const { handleStartNewTrip, isStartingTrip } = useStartNewTrip({
    markActive,
    tag: 'threads',
    threads,
  });
  const deletion = useThreadDeletion({ refresh, removeThread, threads });
  const rename = useThreadRename({ renameThread });

  const handleOpenThread = useCallback(
    (threadId: string) => {
      router.push({ pathname: CHAT_PATH, params: { threadId } });
    },
    [router]
  );

  const handleAskByVoice = useCallback(() => {
    router.push({ pathname: CHAT_PATH, params: { focusVoice: '1' } });
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push(DASHBOARD_PATH);
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <AllTripsScreen
      deletion={deletion}
      isStartingTrip={isStartingTrip}
      list={{
        hasMore,
        isLoadingMore,
        loadMoreFailed,
        onLoadMore: fetchMore,
        onRetry: refresh,
        status,
        syncFailed,
        threads,
      }}
      onAskByVoice={handleAskByVoice}
      onBack={handleBack}
      onGoHome={handleGoHome}
      onOpenThread={handleOpenThread}
      onStartNewTrip={handleStartNewTrip}
      rename={rename}
    />
  );
}
