import { useRouter } from 'expo-router';

import { DashboardScreen } from '../src/components';
import { useRecentThreads } from '../src/hooks';
import { createRemoteThread, generateThreadId } from '../src/services';

export default function DashboardRoute() {
  const router = useRouter();
  const { status, threads, refresh } = useRecentThreads();

  const handleStartNewTrip = async () => {
    const threadId = generateThreadId();

    router.push({ pathname: '/chat', params: { threadId } });

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
  };

  const handleAskByVoice = () => {
    router.push({ pathname: '/chat', params: { focusVoice: '1' } });
  };

  return (
    <DashboardScreen
      onAskByVoice={handleAskByVoice}
      onOpenThread={handleOpenThread}
      onStartNewTrip={handleStartNewTrip}
      recentThreads={threads}
      recentThreadsStatus={status}
    />
  );
}
