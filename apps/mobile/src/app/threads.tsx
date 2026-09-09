import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { AllTripsScreen } from '../components';
import { useAllThreads } from '../hooks';
import { deleteRemoteThread } from '../services';

import type { ThreadItem } from '../services';

export default function ThreadsRoute() {
  const router = useRouter();
  const { status, threads, isLoadingMore, hasMore, fetchMore, refresh, removeThread } =
    useAllThreads();
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const handleOpenThread = useCallback(
    (threadId: string) => {
      router.push({ pathname: '/chat', params: { threadId } });
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
              Alert.alert('Couldn’t delete this trip. Please try again.');
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

  return (
    <AllTripsScreen
      deletingThreadId={deletingThreadId}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onDeleteThread={handleDeleteThread}
      onLoadMore={fetchMore}
      onOpenThread={handleOpenThread}
      status={status}
      threads={threads}
    />
  );
}
