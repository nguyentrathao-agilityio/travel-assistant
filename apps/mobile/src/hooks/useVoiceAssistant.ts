import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

// Constants
import {
  REALTIME_VOICE_SAMPLE_RATE,
  REALTIME_VOICE_WS_URL,
  VOICE_CONNECTING_TIMEOUT_MS,
  VOICE_ERROR_MESSAGES,
  VOICE_LOCALE,
  VOICE_STATES,
  type VoiceState,
  type VoiceWebSocketPhase,
} from '../constants';

// Services
import { fetchVoiceSessionToken } from '../services/voiceSession';

// Utils
import { arrayBufferToBase64 } from '../utils/base64Audio';
import { extractFinalTranscript, extractRealtimeErrorMessage } from '../utils/realtimeVoiceEvents';

// Types
import type { AudioStream, AudioStreamBuffer, AudioStreamResult } from 'expo-audio';
import type * as ExpoAudioTypes from 'expo-audio';

let audioApi: typeof ExpoAudioTypes | null;

try {
  audioApi = require('expo-audio');
} catch {
  audioApi = null;
}

const requestRecordingPermissionsAsync =
  audioApi?.requestRecordingPermissionsAsync ??
  (async () =>
    ({ canAskAgain: false, expires: 'never', granted: false, status: 'denied' }) as Awaited<
      ReturnType<typeof ExpoAudioTypes.requestRecordingPermissionsAsync>
    >);

const useAudioStream: (
  options: Parameters<typeof ExpoAudioTypes.useAudioStream>[0]
) => AudioStreamResult =
  audioApi?.useAudioStream ??
  (() => ({
    isStreaming: false,
    stream: {
      start: () => Promise.reject(new Error('expo-audio native module is not available')),
      stop: () => {},
    } as AudioStream,
  }));

export type { VoiceState } from '../constants';

interface VoiceStateContext {
  errorMessage: string | null;
  isAgentRunning: boolean;
  isSpeaking: boolean;
  isVoiceTurnActive: boolean;
  wsPhase: VoiceWebSocketPhase;
}

const VOICE_STATE_RULES: Record<VoiceState, (context: VoiceStateContext) => boolean> = {
  [VOICE_STATES.ERROR]: ({ errorMessage }) => Boolean(errorMessage),
  [VOICE_STATES.SPEAKING]: ({ isSpeaking }) => isSpeaking,
  [VOICE_STATES.CONNECTING]: ({ wsPhase }) => wsPhase === VOICE_STATES.CONNECTING,
  [VOICE_STATES.LISTENING]: ({ wsPhase }) => wsPhase === VOICE_STATES.LISTENING,
  [VOICE_STATES.THINKING]: ({ isAgentRunning, isVoiceTurnActive }) =>
    isVoiceTurnActive && isAgentRunning,
  [VOICE_STATES.IDLE]: () => true,
};

const resolveVoiceState = (context: VoiceStateContext): VoiceState =>
  (Object.entries(VOICE_STATE_RULES).find(([, matches]) => matches(context))?.[0] as VoiceState) ??
  VOICE_STATES.IDLE;

interface UseVoiceAssistantOptions {
  isAgentRunning: boolean;
  onTranscript: (text: string) => void;
}

interface UseVoiceAssistantResult {
  voiceState: VoiceState;
  errorMessage: string | null;
  isPermissionDenied: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

/**
 * Voice state machine over the existing chat-send path: STT runs on an OpenAI
 * Realtime transcription session (WebSocket, server VAD, never auto-replies by
 * design), transcripts feed the same `onTranscript`/send path as typed text, and
 * `speak` reads the agent's reply via on-device TTS — no parallel pipeline.
 * `thinking` only fires for voice-started turns (via `isAgentRunning`).
 */
export const useVoiceAssistant = ({
  isAgentRunning,
  onTranscript,
}: UseVoiceAssistantOptions): UseVoiceAssistantResult => {
  const [wsPhase, setWsPhase] = useState<VoiceWebSocketPhase>(VOICE_STATES.IDLE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const wsPhaseRef = useRef<VoiceWebSocketPhase>(VOICE_STATES.IDLE);
  const hasFinalizedRef = useRef(false);
  const isVoiceTurnActiveRef = useRef(false);
  const wasAgentRunningRef = useRef(isAgentRunning);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAudioStreamStoppedRef = useRef(true);

  useEffect(() => {
    const wasRunning = wasAgentRunningRef.current;
    wasAgentRunningRef.current = isAgentRunning;

    if (wasRunning && !isAgentRunning) {
      isVoiceTurnActiveRef.current = false;
    }
  }, [isAgentRunning]);

  const handleAudioBuffer = useCallback((buffer: AudioStreamBuffer) => {
    const socket = wsRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({ audio: arrayBufferToBase64(buffer.data), type: 'input_audio_buffer.append' })
    );
  }, []);

  const { stream: audioStream } = useAudioStream({
    channels: 1,
    encoding: 'int16',
    onBuffer: handleAudioBuffer,
    sampleRate: REALTIME_VOICE_SAMPLE_RATE,
  });

  // Both closeSession and the ws onclose handler stop the stream. AudioStream
  // releases its native shared object after .stop(), so this must be idempotent.
  // The ref covers same-instance double calls (onclose + closeSession); the
  // try/catch covers the object being invalidated out from under us by a Fast
  // Refresh remount, which the ref can't observe.
  const stopAudioStream = useCallback(() => {
    if (isAudioStreamStoppedRef.current) return;

    isAudioStreamStoppedRef.current = true;

    try {
      audioStream.stop();
    } catch {
      // Already stopped/released.
    }
  }, [audioStream]);

  const closeSession = useCallback(() => {
    stopAudioStream();
    const socket = wsRef.current;

    wsRef.current = null;

    if (socket && socket.readyState === WebSocket.OPEN) socket.close();
  }, [stopAudioStream]);

  useEffect(() => closeSession, [closeSession]);

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const setPhase = useCallback(
    (phase: VoiceWebSocketPhase) => {
      wsPhaseRef.current = phase;
      setWsPhase(phase);

      if (phase !== VOICE_STATES.CONNECTING) {
        clearConnectTimeout();
        return;
      }

      clearConnectTimeout();
      connectTimeoutRef.current = setTimeout(() => {
        hasFinalizedRef.current = true;
        closeSession();
        wsPhaseRef.current = VOICE_STATES.IDLE;
        setWsPhase(VOICE_STATES.IDLE);
        setErrorMessage(VOICE_ERROR_MESSAGES.CONNECTING_TIMEOUT);
      }, VOICE_CONNECTING_TIMEOUT_MS);
    },
    [clearConnectTimeout, closeSession]
  );

  useEffect(() => clearConnectTimeout, [clearConnectTimeout]);

  const startListening = useCallback(() => {
    if (wsPhaseRef.current !== VOICE_STATES.IDLE) return;

    setErrorMessage(null);
    Speech.stop();
    setIsSpeaking(false);
    setPhase(VOICE_STATES.CONNECTING);

    requestRecordingPermissionsAsync()
      .then((permission) => {
        if (!permission.granted) {
          setIsPermissionDenied(true);
          setErrorMessage(VOICE_ERROR_MESSAGES.PERMISSION_DENIED);
          setPhase(VOICE_STATES.IDLE);
          return;
        }

        setIsPermissionDenied(false);

        return fetchVoiceSessionToken().then(({ token }) => {
          hasFinalizedRef.current = false;

          const socket = new WebSocket(REALTIME_VOICE_WS_URL, [
            'realtime',
            `openai-insecure-api-key.${token}`,
          ]);

          wsRef.current = socket;

          socket.onopen = () => {
            isAudioStreamStoppedRef.current = false;
            socket.send(
              JSON.stringify({
                session: {
                  audio: {
                    input: {
                      format: { rate: REALTIME_VOICE_SAMPLE_RATE, type: 'audio/pcm' },
                      turn_detection: { type: 'server_vad' },
                    },
                  },
                  type: 'transcription',
                },
                type: 'session.update',
              })
            );
            audioStream.start().catch(() => {
              closeSession();
              setPhase(VOICE_STATES.IDLE);
              setErrorMessage(VOICE_ERROR_MESSAGES.STT_UNAVAILABLE);
            });
            setPhase(VOICE_STATES.LISTENING);
          };

          socket.onmessage = (event) => {
            const data = typeof event.data === 'string' ? event.data : '';
            const transcript = extractFinalTranscript(data);

            if (transcript) {
              hasFinalizedRef.current = true;
              isVoiceTurnActiveRef.current = true;
              closeSession();
              setPhase(VOICE_STATES.IDLE);
              onTranscript(transcript);
              return;
            }

            const providerError = extractRealtimeErrorMessage(data);

            if (providerError) {
              hasFinalizedRef.current = true;
              closeSession();
              setPhase(VOICE_STATES.IDLE);
              setErrorMessage(VOICE_ERROR_MESSAGES.STT_UNAVAILABLE);
            }
          };

          socket.onerror = () => {
            hasFinalizedRef.current = true;
            closeSession();
            setPhase(VOICE_STATES.IDLE);
            setErrorMessage(VOICE_ERROR_MESSAGES.STT_UNAVAILABLE);
          };

          socket.onclose = () => {
            wsRef.current = null;
            stopAudioStream();

            if (!hasFinalizedRef.current && wsPhaseRef.current !== VOICE_STATES.IDLE) {
              setErrorMessage(VOICE_ERROR_MESSAGES.NO_SPEECH);
            }

            setPhase(VOICE_STATES.IDLE);
          };
        });
      })
      .catch(() => {
        setErrorMessage(VOICE_ERROR_MESSAGES.STT_UNAVAILABLE);
        setPhase(VOICE_STATES.IDLE);
      });
  }, [audioStream, closeSession, onTranscript, setPhase, stopAudioStream]);

  const stopListening = useCallback(() => {
    hasFinalizedRef.current = true;
    closeSession();
    setPhase(VOICE_STATES.IDLE);
  }, [closeSession, setPhase]);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;

    setErrorMessage(null);
    setIsSpeaking(true);
    Speech.speak(text, {
      language: VOICE_LOCALE,
      onDone: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        setErrorMessage(VOICE_ERROR_MESSAGES.TTS_FAILED);
      },
      onStopped: () => setIsSpeaking(false),
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  useEffect(() => stopSpeaking, [stopSpeaking]);

  const voiceState = resolveVoiceState({
    errorMessage,
    isAgentRunning,
    isSpeaking,
    isVoiceTurnActive: isVoiceTurnActiveRef.current,
    wsPhase,
  });

  return {
    errorMessage,
    isPermissionDenied,
    speak,
    startListening,
    stopListening,
    stopSpeaking,
    voiceState,
  };
};
