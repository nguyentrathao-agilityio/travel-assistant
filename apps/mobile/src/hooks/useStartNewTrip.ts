import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

// Services
import { createRemoteThread, findEmptyThreadId, generateThreadId } from '../services';

// Constants
import { CHAT_PATH } from '../constants';

// Types
import type { ThreadItem } from '../services';

interface UseStartNewTripOptions {
  markActive: (threadId: string) => void;
  tag: string;
  threads: ThreadItem[];
}

interface UseStartNewTripResult {
  handleStartNewTrip: () => Promise<void>;
  isStartingTrip: boolean;
}

export const useStartNewTrip = ({
  markActive,
  tag,
  threads,
}: UseStartNewTripOptions): UseStartNewTripResult => {
  const router = useRouter();
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const isStartingTripRef = useRef(false);

  const handleStartNewTrip = useCallback(async () => {
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
      } catch (caught) {
        console.warn(`[${tag}] Failed to prewarm remote thread`, caught);
      }
    } finally {
      isStartingTripRef.current = false;
      setIsStartingTrip(false);
    }
  }, [threads, router, markActive, tag]);

  return { handleStartNewTrip, isStartingTrip };
};
