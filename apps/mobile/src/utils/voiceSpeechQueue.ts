import * as Speech from 'expo-speech';

// Utils
import { voiceLocaleForText } from './voice';

interface SpeakCallbacks {
  onDone: () => void;
  onError: (error: unknown) => void;
}

export interface VoiceSpeechQueueDeps {
  speak(text: string, callbacks: SpeakCallbacks): void;
  stop(): void;
}

export const defaultVoiceSpeechQueueDeps: VoiceSpeechQueueDeps = {
  speak: (text, { onDone, onError }) => {
    Speech.speak(text, { language: voiceLocaleForText(text), onDone, onError });
  },
  stop: () => {
    void Speech.stop();
  },
};

/** Speaks streamed reply sentences one after another with on-device TTS; `onIdle` fires when a finished batch drains. */
export const createVoiceSpeechQueue = (deps: VoiceSpeechQueueDeps, onIdle: () => void) => {
  let pending: string[] = [];
  let isSpeaking = false;
  let batchEnded = false;
  let generation = 0;

  const settleIfIdle = () => {
    if (isSpeaking || pending.length > 0 || !batchEnded) return;

    batchEnded = false;
    onIdle();
  };

  const speakNext = () => {
    if (isSpeaking) return;

    const text = pending.shift();

    if (!text) {
      settleIfIdle();
      return;
    }

    const owner = generation;
    const next = () => {
      if (owner !== generation) return;

      isSpeaking = false;
      speakNext();
    };

    isSpeaking = true;

    try {
      deps.speak(text, {
        onDone: next,
        onError: (error) => {
          console.warn('[voice] Failed to speak TTS sentence.', error);
          next();
        },
      });
    } catch (error) {
      console.warn('[voice] Failed to speak TTS sentence.', error);
      next();
    }
  };

  return {
    enqueue(text: string) {
      const normalized = text.replace(/\s+/g, ' ').trim();

      if (!normalized) return;

      pending.push(normalized);
      speakNext();
    },
    markBatchEnd() {
      batchEnded = true;
      settleIfIdle();
    },
    clear() {
      generation += 1;
      pending = [];

      if (isSpeaking) deps.stop();

      isSpeaking = false;
      batchEnded = false;
    },
    get isPlaying() {
      return isSpeaking || pending.length > 0;
    },
  };
};
