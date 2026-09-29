import { useRouter } from 'expo-router';
import { useCallback } from 'react';

// Constants
import { CHAT_PATH, DASHBOARD_PATH, FOCUS_VOICE_ENABLED } from '../constants';

// Components
import { AllTripsScreen } from '../screens';
import { goBackOrReplace } from '../utils/navigation';

// Hooks
import { useActiveThreadId, useAllThreads, useStartNewTrip, useThreadActions } from '../hooks';

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
  const { deletion, rename } = useThreadActions({
    refresh,
    removeThread,
    renameThread,
    threads,
  });

  const handleOpenThread = useCallback(
    (threadId: string) => {
      router.push({ pathname: CHAT_PATH, params: { threadId } });
    },
    [router]
  );

  const handleAskByVoice = useCallback(() => {
    router.push({ pathname: CHAT_PATH, params: { focusVoice: FOCUS_VOICE_ENABLED } });
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.push(DASHBOARD_PATH);
  }, [router]);

  const handleBack = useCallback(() => {
    goBackOrReplace(router, DASHBOARD_PATH);
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
