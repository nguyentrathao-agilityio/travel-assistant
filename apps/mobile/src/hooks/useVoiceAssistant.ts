import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

// Services
import { fetchVoiceSessionToken } from '../services/voiceSession';

// Constants
import {
  MIC_LEVEL_GAIN,
  REALTIME_VOICE_SAMPLE_RATE,
  REALTIME_VOICE_WS_URL,
  VOICE_CONNECTING_TIMEOUT_MS,
  VOICE_ERROR_MESSAGES,
  VOICE_STATES,
  type VoiceState,
  type VoiceWebSocketPhase,
} from '../constants';

// Utils
import {
  arrayBufferToBase64,
  calculateMicLevel,
  extractFinalTranscript,
  isFinalTranscriptEvent,
  extractRealtimeErrorMessage,
  isEmptyCommitError,
  extractTranscriptDelta,
  resolveVoiceState,
} from '../utils/voice';
import { VOICE_RECORDING_MAX_PCM_BYTES, type VoiceRecording } from '../utils/wav';

// Types
import type { AudioStream, AudioStreamBuffer, AudioStreamResult } from 'expo-audio';
import type * as ExpoAudioTypes from 'expo-audio';
import type { RefObject } from 'react';
import type { SharedValue } from 'react-native-reanimated';

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

interface UseVoiceAssistantOptions {
  isAgentRunning: boolean;
  keepSessionOpenRef?: RefObject<boolean>;
  onTranscript: (text: string, recording: VoiceRecording | null) => void;
}

interface UseVoiceAssistantResult {
  voiceState: VoiceState;
  errorMessage: string | null;
  isPermissionDenied: boolean;
  partialTranscript: string;
  micLevel: SharedValue<number>;
  startListening: () => void;
  stopListening: () => void;
  cancelListening: () => void;
}

/** OpenAI Realtime STT: dictation closes per utterance; voice mode parks the session between turns. */
export const useVoiceAssistant = ({
  isAgentRunning,
  keepSessionOpenRef,
  onTranscript,
}: UseVoiceAssistantOptions): UseVoiceAssistantResult => {
  const [wsPhase, setWsPhase] = useState<VoiceWebSocketPhase>(VOICE_STATES.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const micLevel = useSharedValue(0);
  const wsRef = useRef<WebSocket | null>(null);
  const wsPhaseRef = useRef<VoiceWebSocketPhase>(VOICE_STATES.IDLE);
  const hasFinalizedRef = useRef(false);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAudioStreamStoppedRef = useRef(true);
  const sessionGenerationRef = useRef(0);
  const isMountedRef = useRef(true);
  const isFinalizingRef = useRef(false);
  const isAgentRunningRef = useRef(isAgentRunning);
  const isParkedRef = useRef(false);
  const recordingRef = useRef<VoiceRecording>({ byteLength: 0, chunks: [] });

  isAgentRunningRef.current = isAgentRunning;

  const handleAudioBuffer = useCallback(
    (buffer: AudioStreamBuffer) => {
      const socket = wsRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      socket.send(
        JSON.stringify({
          audio: arrayBufferToBase64(buffer.data),
          type: 'input_audio_buffer.append',
        })
      );

      const recording = recordingRef.current;
      const room = VOICE_RECORDING_MAX_PCM_BYTES - recording.byteLength;

      if (room > 0) {
        const chunk =
          buffer.data.byteLength > room ? buffer.data.slice(0, room) : buffer.data.slice(0);

        recording.chunks.push(chunk);
        recording.byteLength += chunk.byteLength;
      }

      micLevel.value = withTiming(calculateMicLevel(buffer.data, MIC_LEVEL_GAIN), {
        duration: 80,
      });
    },
    [micLevel]
  );

  const { stream: audioStream } = useAudioStream({
    channels: 1,
    encoding: 'int16',
    onBuffer: handleAudioBuffer,
    sampleRate: REALTIME_VOICE_SAMPLE_RATE,
  });

  const resetRecording = useCallback(() => {
    recordingRef.current = { byteLength: 0, chunks: [] };
  }, []);

  // Multiple cleanup paths can stop and release the native stream, so keep this idempotent.
  const stopAudioStream = useCallback(() => {
    if (isAudioStreamStoppedRef.current) return;

    isAudioStreamStoppedRef.current = true;
    micLevel.value = 0;

    try {
      audioStream.stop();
    } catch (error) {
      console.warn('Failed to stop audio stream during cleanup.', error);
    }
  }, [audioStream, micLevel]);

  const closeSession = useCallback(
    (targetSocket: WebSocket | null = wsRef.current) => {
      stopAudioStream();
      isParkedRef.current = false;

      if (wsRef.current === targetSocket) wsRef.current = null;

      if (
        targetSocket &&
        (targetSocket.readyState === WebSocket.CONNECTING ||
          targetSocket.readyState === WebSocket.OPEN)
      ) {
        targetSocket.close();
      }
    },
    [stopAudioStream]
  );

  const closeSessionRef = useRef(closeSession);
  closeSessionRef.current = closeSession;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      sessionGenerationRef.current += 1;
      closeSessionRef.current();
    };
  }, []);

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

  const failSession = useCallback(
    (socket?: WebSocket) => {
      hasFinalizedRef.current = true;
      setPartialTranscript('');
      closeSession(socket);
      setPhase(VOICE_STATES.IDLE);
      setErrorMessage(VOICE_ERROR_MESSAGES.STT_UNAVAILABLE);
    },
    [closeSession, setPhase]
  );

  const continueListening = useCallback(
    (socket: WebSocket) => {
      resetRecording();
      isFinalizingRef.current = false;
      setPartialTranscript('');

      if (isAudioStreamStoppedRef.current) {
        isAudioStreamStoppedRef.current = false;
        audioStream.start().catch(() => failSession(socket));
      }

      setPhase(VOICE_STATES.LISTENING);
    },
    [audioStream, failSession, resetRecording, setPhase]
  );

  const resumeParkedSession = useCallback(
    (socket: WebSocket) => {
      isParkedRef.current = false;
      hasFinalizedRef.current = false;
      setErrorMessage(null);
      socket.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
      continueListening(socket);
    },
    [continueListening]
  );

  const startListening = useCallback(() => {
    if (wsPhaseRef.current !== VOICE_STATES.IDLE || isAgentRunningRef.current) return;

    const parkedSocket = wsRef.current;

    if (isParkedRef.current && parkedSocket?.readyState === WebSocket.OPEN) {
      resumeParkedSession(parkedSocket);
      return;
    }

    const generation = sessionGenerationRef.current + 1;
    sessionGenerationRef.current = generation;
    const isCurrentSession = () =>
      isMountedRef.current && sessionGenerationRef.current === generation;

    setErrorMessage(null);
    isFinalizingRef.current = false;
    setPhase(VOICE_STATES.CONNECTING);

    requestRecordingPermissionsAsync()
      .then((permission) => {
        if (!isCurrentSession()) return;

        if (!permission.granted) {
          setIsPermissionDenied(true);
          setErrorMessage(VOICE_ERROR_MESSAGES.PERMISSION_DENIED);
          setPhase(VOICE_STATES.IDLE);
          return;
        }

        setIsPermissionDenied(false);

        return fetchVoiceSessionToken().then(({ token }) => {
          if (!isCurrentSession()) return;

          hasFinalizedRef.current = false;
          setPartialTranscript('');

          const socket = new WebSocket(REALTIME_VOICE_WS_URL, [
            'realtime',
            `openai-insecure-api-key.${token}`,
          ]);

          wsRef.current = socket;

          socket.onopen = () => {
            if (!isCurrentSession() || wsRef.current !== socket) {
              closeSession(socket);
              return;
            }

            isAudioStreamStoppedRef.current = false;
            resetRecording();
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
            audioStream.start().catch(() => failSession(socket));
            setPhase(VOICE_STATES.LISTENING);
          };

          socket.onmessage = (event) => {
            if (!isCurrentSession() || wsRef.current !== socket || isParkedRef.current) return;

            const data = typeof event.data === 'string' ? event.data : '';
            const transcript = extractFinalTranscript(data);

            if (transcript) {
              if (hasFinalizedRef.current) return;

              hasFinalizedRef.current = true;

              setPartialTranscript('');

              if (keepSessionOpenRef?.current) {
                stopAudioStream();
                isParkedRef.current = true;
              } else {
                closeSession();
              }

              setPhase(VOICE_STATES.IDLE);

              const recording = recordingRef.current;

              resetRecording();
              onTranscript(transcript, recording.byteLength > 0 ? recording : null);
              return;
            }

            // Voice mode keeps listening after an empty transcript or an empty manual commit.
            if (
              keepSessionOpenRef?.current &&
              (isFinalTranscriptEvent(data) || isEmptyCommitError(data))
            ) {
              continueListening(socket);
              return;
            }

            if (isFinalTranscriptEvent(data)) {
              hasFinalizedRef.current = true;
              setPartialTranscript('');
              closeSession(socket);
              setPhase(VOICE_STATES.IDLE);
              return;
            }

            const delta = extractTranscriptDelta(data);

            if (delta) {
              setPartialTranscript((prev) => prev + delta);
              return;
            }

            if (extractRealtimeErrorMessage(data)) failSession(socket);
          };

          socket.onerror = () => {
            if (isCurrentSession() && wsRef.current === socket) failSession(socket);
          };

          socket.onclose = () => {
            if (!isCurrentSession() || wsRef.current !== socket) return;

            wsRef.current = null;
            isParkedRef.current = false;
            stopAudioStream();
            setPartialTranscript('');

            if (!hasFinalizedRef.current && wsPhaseRef.current !== VOICE_STATES.IDLE) {
              setErrorMessage(VOICE_ERROR_MESSAGES.NO_SPEECH);
            }

            setPhase(VOICE_STATES.IDLE);
          };
        });
      })
      .catch(() => {
        if (!isCurrentSession()) return;

        setErrorMessage(VOICE_ERROR_MESSAGES.STT_UNAVAILABLE);
        setPhase(VOICE_STATES.IDLE);
      });
  }, [
    audioStream,
    closeSession,
    continueListening,
    failSession,
    keepSessionOpenRef,
    onTranscript,
    resetRecording,
    resumeParkedSession,
    setPhase,
    stopAudioStream,
  ]);

  const stopListening = useCallback(() => {
    const socket = wsRef.current;

    if (
      wsPhaseRef.current !== VOICE_STATES.LISTENING ||
      isFinalizingRef.current ||
      socket?.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    isFinalizingRef.current = true;
    stopAudioStream();
    socket.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    setPhase(VOICE_STATES.PROCESSING);
  }, [setPhase, stopAudioStream]);

  const cancelListening = useCallback(() => {
    sessionGenerationRef.current += 1;
    hasFinalizedRef.current = true;
    isFinalizingRef.current = false;
    setPartialTranscript('');
    closeSession();
    setPhase(VOICE_STATES.IDLE);
  }, [closeSession, setPhase]);

  const voiceState = resolveVoiceState({ errorMessage, wsPhase });

  return {
    cancelListening,
    errorMessage,
    isPermissionDenied,
    micLevel,
    partialTranscript,
    startListening,
    stopListening,
    voiceState,
  };
};
