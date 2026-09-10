import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

import { REALTIME_VOICE_SAMPLE_RATE, REALTIME_VOICE_WS_URL, VOICE_LOCALE } from '../constants';
import { fetchVoiceSessionToken } from '../services/voiceSession';
import { arrayBufferToBase64 } from '../utils/base64Audio';
import { extractFinalTranscript, extractRealtimeErrorMessage } from '../utils/realtimeVoiceEvents';

import type { AudioStream, AudioStreamBuffer, AudioStreamResult } from 'expo-audio';
import type * as ExpoAudioTypes from 'expo-audio';

// Native module may not be linked yet (Expo Go / a stale dev client) — a
// top-level import would crash every screen via the `hooks` barrel, so load
// defensively and degrade to the `error` state instead.
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

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

type WsPhase = 'idle' | 'connecting' | 'listening';

const PERMISSION_DENIED_MESSAGE =
  'Microphone access is off. Enable it in Settings to use voice, or keep typing.';
const NO_SPEECH_MESSAGE = "Didn't catch that — try again or type your question.";
const STT_UNAVAILABLE_MESSAGE = "Voice input isn't available right now — please type instead.";
const TTS_FAILED_MESSAGE = "Couldn't play the response out loud.";

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
  const [wsPhase, setWsPhase] = useState<WsPhase>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const wsPhaseRef = useRef<WsPhase>('idle');
  const hasFinalizedRef = useRef(false);
  const isVoiceTurnActiveRef = useRef(false);
  const wasAgentRunningRef = useRef(isAgentRunning);

  useEffect(() => {
    const wasRunning = wasAgentRunningRef.current;
    wasAgentRunningRef.current = isAgentRunning;

    if (wasRunning && !isAgentRunning) {
      isVoiceTurnActiveRef.current = false;
    }
  }, [isAgentRunning]);

  const setPhase = useCallback((phase: WsPhase) => {
    wsPhaseRef.current = phase;
    setWsPhase(phase);
  }, []);

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

  // Both closeSession and the ws onclose handler stop the stream — calling
  // .stop() twice throws (the native object is already released), so guard it.
  const stopAudioStream = useCallback(() => {
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

  const startListening = useCallback(() => {
    setErrorMessage(null);
    Speech.stop();
    setIsSpeaking(false);
    setPhase('connecting');

    requestRecordingPermissionsAsync()
      .then((permission) => {
        if (!permission.granted) {
          setIsPermissionDenied(true);
          setErrorMessage(PERMISSION_DENIED_MESSAGE);
          setPhase('idle');
          return;
        }

        setIsPermissionDenied(false);

        return fetchVoiceSessionToken().then(({ token }) => {
          hasFinalizedRef.current = false;

          // Transcription sessions never auto-reply by design — LangGraph +
          // expo-speech stay the sole source of the assistant's voice.
          const socket = new WebSocket(REALTIME_VOICE_WS_URL, [
            'realtime',
            `openai-insecure-api-key.${token}`,
          ]);

          wsRef.current = socket;

          socket.onopen = () => {
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
              setPhase('idle');
              setErrorMessage(STT_UNAVAILABLE_MESSAGE);
            });
            setPhase('listening');
          };

          socket.onmessage = (event) => {
            const data = typeof event.data === 'string' ? event.data : '';
            const transcript = extractFinalTranscript(data);

            if (transcript) {
              hasFinalizedRef.current = true;
              isVoiceTurnActiveRef.current = true;
              closeSession();
              setPhase('idle');
              onTranscript(transcript);
              return;
            }

            const providerError = extractRealtimeErrorMessage(data);

            if (providerError) {
              hasFinalizedRef.current = true;
              closeSession();
              setPhase('idle');
              setErrorMessage(STT_UNAVAILABLE_MESSAGE);
            }
          };

          socket.onerror = () => {
            hasFinalizedRef.current = true;
            closeSession();
            setPhase('idle');
            setErrorMessage(STT_UNAVAILABLE_MESSAGE);
          };

          socket.onclose = () => {
            wsRef.current = null;
            stopAudioStream();

            if (!hasFinalizedRef.current && wsPhaseRef.current !== 'idle') {
              setErrorMessage(NO_SPEECH_MESSAGE);
            }

            setPhase('idle');
          };
        });
      })
      .catch(() => {
        setErrorMessage(STT_UNAVAILABLE_MESSAGE);
        setPhase('idle');
      });
  }, [audioStream, closeSession, onTranscript, setPhase, stopAudioStream]);

  const stopListening = useCallback(() => {
    hasFinalizedRef.current = true;
    closeSession();
    setPhase('idle');
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
        setErrorMessage(TTS_FAILED_MESSAGE);
      },
      onStopped: () => setIsSpeaking(false),
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  useEffect(() => stopSpeaking, [stopSpeaking]);

  const voiceState: VoiceState = errorMessage
    ? 'error'
    : isSpeaking
      ? 'speaking'
      : wsPhase === 'connecting'
        ? 'connecting'
        : wsPhase === 'listening'
          ? 'listening'
          : isVoiceTurnActiveRef.current && isAgentRunning
            ? 'thinking'
            : 'idle';

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
