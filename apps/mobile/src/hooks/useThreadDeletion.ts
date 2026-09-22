import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

// Services
import { deleteRemoteThread } from '../services';

// Types
import type { ThreadItem } from '../services';

interface UseThreadDeletionOptions {
  refresh: () => void;
  removeThread: (threadId: string) => void;
  threads: ThreadItem[];
}

export interface ThreadDeletionProps {
  deletingThreadId: string | null;
  isDeletingAll: boolean;
  onDeleteAllTrips: () => void;
  onDeleteThread: (thread: ThreadItem) => void;
}

// Owns the delete-one / delete-all confirm-then-call flow for the All trips screen.
export const useThreadDeletion = ({
  refresh,
  removeThread,
  threads,
}: UseThreadDeletionOptions): ThreadDeletionProps => {
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const onDeleteThread = useCallback(
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

  const onDeleteAllTrips = useCallback(() => {
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

  return { deletingThreadId, isDeletingAll, onDeleteAllTrips, onDeleteThread };
};
