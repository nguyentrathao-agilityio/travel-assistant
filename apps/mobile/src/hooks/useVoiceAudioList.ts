import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchVoiceAudioList } from '../services/voiceAudio';
import { threadQueryKeys } from './threadQueryKeys';

const NO_RECORDINGS: ReadonlyMap<string, number> = new Map();

/** Durations (ms) of this thread's saved voice recordings, keyed by user message id (empty if storage is off). */
export const useVoiceAudioList = (threadId: string): ReadonlyMap<string, number> => {
  const { data } = useQuery({
    enabled: Boolean(threadId),
    queryFn: () => fetchVoiceAudioList(threadId),
    queryKey: threadQueryKeys.voiceAudio(threadId),
    retry: false,
  });

  return useMemo(
    () =>
      data
        ? new Map(data.map(({ messageId, durationMs }) => [messageId, durationMs]))
        : NO_RECORDINGS,
    [data]
  );
};
