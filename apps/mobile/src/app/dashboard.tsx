import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

// Services
import { createRemoteThread, findEmptyThreadId, generateThreadId } from '../services';

// Constants
import { CHAT_PATH, THREADS_PATH } from '../constants';

// Components
import { DashboardScreen } from '../screens';

// Hooks
import { useActiveThreadId, useRecentThreads } from '../hooks';

export default function DashboardRoute() {
  const router = useRouter();
  const { status, threads, refresh } = useRecentThreads();
  const { activeThreadId, markActive, refresh: refreshActiveThreadId } = useActiveThreadId();
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const isStartingTripRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshActiveThreadId();
    }, [refresh, refreshActiveThreadId])
  );

  const handleStartNewTrip = async () => {
    if (isStartingTripRef.current) return;

    isStartingTripRef.current = true;
    setIsStartingTrip(true);

    try {
      const emptyThreadId = findEmptyThreadId(threads);

      if (emptyThreadId) {
        router.push({ pathname: CHAT_PATH, params: { threadId: emptyThreadId } });
        markActive(emptyThreadId);
        return;
      }

      const threadId = generateThreadId();

      router.push({ pathname: CHAT_PATH, params: { threadId } });
      markActive(threadId);

      try {
        await createRemoteThread(threadId);
      } catch (caught) {
        console.warn('[dashboard] Failed to prewarm remote thread', caught);
      }
    } finally {
      isStartingTripRef.current = false;
      setIsStartingTrip(false);
    }
  };

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
