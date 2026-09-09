import { useRouter } from 'expo-router';

import { DashboardScreen } from '../components';
import { useActiveThreadId, useRecentThreads } from '../hooks';
import { createRemoteThread, generateThreadId } from '../services';

export default function DashboardRoute() {
  const router = useRouter();
  const { status, threads, refresh } = useRecentThreads();
  const { activeThreadId, markActive } = useActiveThreadId();

  const handleStartNewTrip = async () => {
    const threadId = generateThreadId();

    router.push({ pathname: '/chat', params: { threadId } });
    markActive(threadId);

    try {
      await createRemoteThread(threadId);
      refresh();
    } catch {
      // The chat screen still opens with a client-generated id; it will surface
      // the failure itself once it actually needs the thread to exist server-side.
    }
  };

  const handleOpenThread = (threadId: string) => {
    router.push({ pathname: '/chat', params: { threadId } });
    markActive(threadId);
  };

  const handleAskByVoice = () => {
    router.push({ pathname: '/chat', params: { focusVoice: '1' } });
  };

  const handleSeeAll = () => {
    router.push('/threads');
  };

  return (
    <DashboardScreen
      continueThreadId={activeThreadId}
      onAskByVoice={handleAskByVoice}
      onOpenThread={handleOpenThread}
      onSeeAll={handleSeeAll}
      onStartNewTrip={handleStartNewTrip}
      recentThreads={threads}
      recentThreadsStatus={status}
    />
  );
}
