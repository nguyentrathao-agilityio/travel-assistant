import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

// Constants
import { SPEECH_MARKDOWN_NOISE_PATTERN } from '../constants';

// Services
import { fetchVoiceAudioPlaybackUrl } from '../services/voiceAudio';

// Utils
import { voiceLocaleForText } from '../utils/voice';

import type * as ExpoAudioTypes from 'expo-audio';

export interface MessagePlaybackDeps {
  createPlayer(uri: string): { play(): void; remove(): void; onFinish(listener: () => void): void };
  speak(text: string, onDone: () => void): void;
  stopSpeech(): void;
  playbackUrl(threadId: string, messageId: string): Promise<string>;
}

// Loaded on first playback so importing this hook never touches the native audio module.
const audioApi = (): typeof ExpoAudioTypes => require('expo-audio');

export const defaultMessagePlaybackDeps: MessagePlaybackDeps = {
  createPlayer: (uri) => {
    const player = audioApi().createAudioPlayer({ uri });

    return {
      onFinish: (listener) => {
        player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) listener();
        });
      },
      play: () => player.play(),
      remove: () => player.remove(),
    };
  },
  playbackUrl: fetchVoiceAudioPlaybackUrl,
  speak: (text, onDone) => {
    const spoken = text.replace(SPEECH_MARKDOWN_NOISE_PATTERN, '');

    Speech.speak(spoken, {
      language: voiceLocaleForText(spoken),
      onDone,
      onError: onDone,
      onStopped: onDone,
    });
  },
  stopSpeech: () => {
    void Speech.stop();
  },
};

/** One-at-a-time replay of recorded user messages (expo-audio) and assistant replies (expo-speech). */
export const useMessagePlayback = ({
  threadId,
  deps = defaultMessagePlaybackDeps,
}: {
  threadId: string;
  deps?: MessagePlaybackDeps;
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const generationRef = useRef(0);
  const releaseRef = useRef<(() => void) | null>(null);
  const playingIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    releaseRef.current?.();
    releaseRef.current = null;
    playingIdRef.current = null;
    setPlayingId(null);
    setLoadingId(null);
  }, []);

  const finish = useCallback(
    (generation: number) => {
      if (generation === generationRef.current) reset();
    },
    [reset]
  );

  const stop = useCallback(() => {
    generationRef.current += 1;
    reset();
  }, [reset]);

  const begin = useCallback(
    (messageId: string): number | null => {
      const wasPlaying = playingIdRef.current === messageId;

      stop();

      if (wasPlaying) return null;

      playingIdRef.current = messageId;
      setPlayingId(messageId);

      return generationRef.current;
    },
    [stop]
  );

  const playRecording = useCallback(
    (messageId: string) => {
      const generation = begin(messageId);

      if (generation === null) return;

      setLoadingId(messageId);
      deps
        .playbackUrl(threadId, messageId)
        .then((url) => {
          if (generation !== generationRef.current) return;

          const player = deps.createPlayer(url);

          releaseRef.current = () => player.remove();
          player.onFinish(() => finish(generation));
          player.play();
          setLoadingId(null);
        })
        .catch((error: unknown) => {
          console.warn('[voice] Could not play the recording.', error);
          finish(generation);
        });
    },
    [begin, deps, finish, threadId]
  );

  const speakReply = useCallback(
    (messageId: string, text: string) => {
      const generation = begin(messageId);

      if (generation === null) return;

      releaseRef.current = () => deps.stopSpeech();
      deps.speak(text, () => finish(generation));
    },
    [begin, deps, finish]
  );

  const stopRef = useRef(stop);

  stopRef.current = stop;

  useEffect(() => () => stopRef.current(), []);

  return { loadingId, playingId, playRecording, speakReply, stop };
};
