import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { deleteRemoteThread, renameRemoteThread } from '../services';

import type { ThreadItem } from '../services';

interface UseThreadActionsOptions {
  refresh: () => void;
  removeThread: (threadId: string) => void;
  renameThread: (threadId: string, title: string) => void;
  threads: ThreadItem[];
}

export interface ThreadDeletionProps {
  deletingThreadId: string | null;
  isDeletingAll: boolean;
  onDeleteAllTrips: () => void;
  onDeleteThread: (thread: ThreadItem) => void;
}

export interface ThreadRenameProps {
  renamingThread: ThreadItem | null;
  isRenaming: boolean;
  onStartRename: (thread: ThreadItem) => void;
  onCancelRename: () => void;
  onConfirmRename: (title: string) => void;
}

export const useThreadActions = ({
  refresh,
  removeThread,
  renameThread,
  threads,
}: UseThreadActionsOptions) => {
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [renamingThread, setRenamingThread] = useState<ThreadItem | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
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

  const onStartRename = useCallback((thread: ThreadItem) => setRenamingThread(thread), []);
  const onCancelRename = useCallback(() => setRenamingThread(null), []);
  const onConfirmRename = useCallback(
    async (title: string) => {
      if (!renamingThread) return;

      setIsRenaming(true);

      try {
        await renameRemoteThread(renamingThread.id, title);
        renameThread(renamingThread.id, title);
        setRenamingThread(null);
      } catch {
        Alert.alert('Couldn’t rename this trip', 'Please try again.');
      } finally {
        setIsRenaming(false);
      }
    },
    [renamingThread, renameThread]
  );

  return {
    deletion: { deletingThreadId, isDeletingAll, onDeleteAllTrips, onDeleteThread },
    rename: { renamingThread, isRenaming, onStartRename, onCancelRename, onConfirmRename },
  };
};
