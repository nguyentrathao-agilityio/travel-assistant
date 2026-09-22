import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';

// Constants
import { CHAT_PATH, THREADS_PATH } from '../constants';

// Components
import { DashboardScreen } from '../screens';

// Hooks
import { useActiveThreadId, useRecentThreads, useStartNewTrip } from '../hooks';

export default function DashboardRoute() {
  const router = useRouter();
  const { status, threads, refresh } = useRecentThreads();
  const { activeThreadId, markActive, refresh: refreshActiveThreadId } = useActiveThreadId();
  const { handleStartNewTrip, isStartingTrip } = useStartNewTrip({
    markActive,
    tag: 'dashboard',
    threads,
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshActiveThreadId();
    }, [refresh, refreshActiveThreadId])
  );

  const handleOpenThread = (threadId: string) => {
    router.push({ pathname: CHAT_PATH, params: { threadId } });
    markActive(threadId);
  };

  const handleAskByVoice = () => {
    router.push({ pathname: CHAT_PATH, params: { focusVoice: '1' } });
  };

  const handleSeeAll = () => {
    router.push(THREADS_PATH);
  };

  return (
    <DashboardScreen
      continueThreadId={activeThreadId}
      isStartingTrip={isStartingTrip}
      onAskByVoice={handleAskByVoice}
      onOpenThread={handleOpenThread}
      onRetryRecentThreads={refresh}
      onSeeAll={handleSeeAll}
      onStartNewTrip={handleStartNewTrip}
      recentThreads={threads}
      recentThreadsStatus={status}
    />
  );
}
