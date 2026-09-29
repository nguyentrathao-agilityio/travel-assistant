import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { CHAT_PATH, FOCUS_VOICE_ENABLED } from '../constants';
import { createRemoteThread, findEmptyThreadId, generateThreadId } from '../services';

import type { ThreadItem } from '../services';

interface UseStartNewTripOptions {
  markActive: (threadId: string) => void;
  tag: string;
  threads: ThreadItem[];
}

interface StartNewTripOptions {
  voiceMode?: boolean;
}

export const useStartNewTrip = ({ markActive, tag, threads }: UseStartNewTripOptions) => {
  const router = useRouter();
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const isStartingTripRef = useRef(false);

  const handleStartNewTrip = useCallback(
    async ({ voiceMode = false }: StartNewTripOptions = {}) => {
      if (isStartingTripRef.current) return;

      isStartingTripRef.current = true;
      setIsStartingTrip(true);

      try {
        const emptyThreadId = findEmptyThreadId(threads);

        if (emptyThreadId) {
          router.push({
            pathname: CHAT_PATH,
            params: {
              ...(voiceMode ? { focusVoice: FOCUS_VOICE_ENABLED } : {}),
              threadId: emptyThreadId,
            },
          });
          markActive(emptyThreadId);
          return;
        }

        const threadId = generateThreadId();

        router.push({
          pathname: CHAT_PATH,
          params: { ...(voiceMode ? { focusVoice: FOCUS_VOICE_ENABLED } : {}), threadId },
        });
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
    },
    [threads, router, markActive, tag]
  );

  return { handleStartNewTrip, isStartingTrip };
};
