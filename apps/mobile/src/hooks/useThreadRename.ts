import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

// Services
import { renameRemoteThread } from '../services';

// Types
import type { ThreadItem } from '../services';

interface UseThreadRenameOptions {
  renameThread: (threadId: string, title: string) => void;
}

export interface ThreadRenameProps {
  renamingThread: ThreadItem | null;
  isRenaming: boolean;
  onStartRename: (thread: ThreadItem) => void;
  onCancelRename: () => void;
  onConfirmRename: (title: string) => void;
}

// Owns the rename dialog open/save flow for the All trips screen.
export const useThreadRename = ({ renameThread }: UseThreadRenameOptions): ThreadRenameProps => {
  const [renamingThread, setRenamingThread] = useState<ThreadItem | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const onStartRename = useCallback((thread: ThreadItem) => {
    setRenamingThread(thread);
  }, []);

  const onCancelRename = useCallback(() => {
    setRenamingThread(null);
  }, []);

  const onConfirmRename = useCallback(
    async (title: string) => {
      if (!renamingThread) return;

      const threadId = renamingThread.id;

      setIsRenaming(true);

      try {
        await renameRemoteThread(threadId, title);
        renameThread(threadId, title);
        setRenamingThread(null);
      } catch {
        Alert.alert('Couldn’t rename this trip', 'Please try again.');
      } finally {
        setIsRenaming(false);
      }
    },
    [renamingThread, renameThread]
  );

  return { renamingThread, isRenaming, onStartRename, onCancelRename, onConfirmRename };
};
