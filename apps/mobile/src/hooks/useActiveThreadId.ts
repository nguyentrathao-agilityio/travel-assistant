import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

// Utils
import { getActiveThreadId, setActiveThreadId } from '../storage';

interface UseActiveThreadIdResult {
  loading: boolean;
  activeThreadId: string | null;
  markActive: (threadId: string) => Promise<void>;
  refresh: () => void;
}

// Persists which thread the user last actually opened, distinct from the newest one on the server.
export const useActiveThreadId = (): UseActiveThreadIdResult => {
  const [loading, setLoading] = useState(true);
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(null);
  const latestCallId = useRef(0);

  const refresh = useCallback(() => {
    const callId = ++latestCallId.current;

    getActiveThreadId(AsyncStorage).then((threadId) => {
      if (callId !== latestCallId.current) return;
      setActiveThreadIdState(threadId);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markActive = useCallback(async (threadId: string) => {
    await setActiveThreadId(AsyncStorage, threadId);
    setActiveThreadIdState(threadId);
  }, []);

  return { loading, activeThreadId, markActive, refresh };
};
