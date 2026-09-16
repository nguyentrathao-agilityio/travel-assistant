import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { CHAT_PATH, THREADS_PATH } from '../constants';
import { useActiveThreadId, useRecentThreads } from '../hooks';
import { DashboardScreen } from '../screens';
import { createRemoteThread, findEmptyThreadId, generateThreadId } from '../services';

export default function DashboardRoute() {
  const router = useRouter();
  const { status, threads, refresh } = useRecentThreads();
  const { activeThreadId, markActive } = useActiveThreadId();
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const isStartingTripRef = useRef(false);

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
        refresh();
      } catch {
        // The chat screen still opens with a client-generated id; it will surface
        // the failure itself once it actually needs the thread to exist server-side.
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
