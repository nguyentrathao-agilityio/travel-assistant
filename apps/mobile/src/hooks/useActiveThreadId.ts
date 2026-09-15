import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// Utils
import { getActiveThreadId, setActiveThreadId } from '../storage';

interface UseActiveThreadIdResult {
  loading: boolean;
  activeThreadId: string | null;
  markActive: (threadId: string) => Promise<void>;
}

// Persists which thread the user last actually opened, distinct from the newest one on the server.
export const useActiveThreadId = (): UseActiveThreadIdResult => {
  const [loading, setLoading] = useState(true);
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getActiveThreadId(AsyncStorage).then((threadId) => {
      if (cancelled) return;
      setActiveThreadIdState(threadId);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const markActive = useCallback(async (threadId: string) => {
    await setActiveThreadId(AsyncStorage, threadId);
    setActiveThreadIdState(threadId);
  }, []);

  return { loading, activeThreadId, markActive };
};
