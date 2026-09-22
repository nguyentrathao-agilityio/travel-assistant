import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

// Services
import { deleteRemoteThread } from '../services';

// Constants
import { CHAT_PATH, DASHBOARD_PATH } from '../constants';

// Components
import { AllTripsScreen } from '../screens';

// Hooks
import { useActiveThreadId, useAllThreads, useStartNewTrip } from '../hooks';

// Types
import type { ThreadItem } from '../services';

export default function ThreadsRoute() {
  const router = useRouter();
  const {
    status,
    threads,
    isLoadingMore,
    hasMore,
    loadMoreFailed,
    fetchMore,
    refresh,
    removeThread,
  } = useAllThreads();
  const { markActive } = useActiveThreadId();
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { handleStartNewTrip, isStartingTrip } = useStartNewTrip({
    markActive,
    tag: 'threads',
    threads,
  });

  const handleOpenThread = useCallback(
    (threadId: string) => {
      router.push({ pathname: CHAT_PATH, params: { threadId } });
    },
    [router]
  );

  const handleDeleteThread = useCallback(
    (thread: ThreadItem) => {
      Alert.alert('Delete trip?', 'This removes the conversation permanently.', [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: async () => {
            setDeletingThreadId(thread.id);

            try {
              await deleteRemoteThread(thread.id);
              removeThread(thread.id);
            } catch {
              Alert.alert('Couldn’t delete this trip', 'Please try again.');
              refresh();
            } finally {
              setDeletingThreadId(null);
            }
          },
          style: 'destructive',
          text: 'Delete',
        },
      ]);
    },
    [refresh, removeThread]
  );

  const handleDeleteAll = useCallback(() => {
    if (threads.length === 0) return;

    Alert.alert('Delete all trips?', 'This removes every conversation permanently.', [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: async () => {
          setIsDeletingAll(true);

          try {
            await Promise.all(threads.map((thread) => deleteRemoteThread(thread.id)));
          } catch {
            Alert.alert('Couldn’t delete all trips', 'Some trips may not have been removed.');
          } finally {
            refresh();
            setIsDeletingAll(false);
          }
        },
        style: 'destructive',
        text: 'Delete All',
      },
    ]);
  }, [threads, refresh]);

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
      deletingThreadId={deletingThreadId}
      hasMore={hasMore}
      isDeletingAll={isDeletingAll}
      isLoadingMore={isLoadingMore}
      isStartingTrip={isStartingTrip}
      loadMoreFailed={loadMoreFailed}
      onAskByVoice={handleAskByVoice}
      onBack={handleBack}
      onDeleteAllTrips={handleDeleteAll}
      onDeleteThread={handleDeleteThread}
      onGoHome={handleGoHome}
      onLoadMore={fetchMore}
      onOpenThread={handleOpenThread}
      onRetry={refresh}
      onStartNewTrip={handleStartNewTrip}
      status={status}
      threads={threads}
    />
  );
}
