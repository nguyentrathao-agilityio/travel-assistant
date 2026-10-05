import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';

// Constants
import {
  VOICE_ERROR_MESSAGES,
  VOICE_MAX_SILENT_RESTARTS,
  VOICE_STATES,
  VOICE_STT_SESSION_STATES,
} from '../constants';

// Services
import { uploadVoiceRecording } from '../services/voiceAudio';

// Utils
import { resolveServerVoiceState } from '../utils/voice';

// Hooks
import { useVoiceAssistant } from './useVoiceAssistant';
import { useVoiceModeConversation } from './useVoiceModeConversation';
import { useVoiceTurn } from './useVoiceTurn';
import { threadQueryKeys } from './threadQueryKeys';

// Types
import type { VoiceState } from '../constants';
import type { VoiceRecording } from '../utils/wav';
import type { SharedValue } from 'react-native-reanimated';

interface UseChatVoiceOptions {
  autoStart: boolean;
  isHistoryLoading: boolean;
  isReady: boolean;
  isRunning: boolean;
  threadId?: string;
  onTurnSettled?: () => void;
  onExitWithPendingApproval?: () => void;
}

export interface ChatVoiceProps {
  agentTranscript: string;
  dictatedTranscript: { text: string; id: number } | null;
  isVoiceModeActive: boolean;
  isVoiceTurnRunning: boolean;
  micLevel: SharedValue<number>;
  onApprovalDecision: (resume: unknown) => void;
  onExitVoiceMode: () => void;
  onStartListening: () => void;
  onStartVoiceMode: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onStopVoiceModeTurn: () => void;
  partialTranscript: string;
  pendingApproval: unknown | null;
  voiceErrorMessage: string | null;
  voiceState: VoiceState;
}

/**
 * Chat-screen voice: dictation fills the composer; voice mode loops
 * listen (STT) → /voice/turn (reply + TTS) → listen, with approval and silent-restart handling.
 */
export const useChatVoice = ({
  autoStart,
  isHistoryLoading,
  isReady,
  isRunning,
  threadId,
  onTurnSettled,
  onExitWithPendingApproval,
}: UseChatVoiceOptions): ChatVoiceProps => {
  const [dictatedTranscript, setDictatedTranscript] = useState<{
    text: string;
    id: number;
  } | null>(null);

  const queryClient = useQueryClient();
  const isVoiceModeActiveRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => {});
  const silentRestartsRef = useRef(0);
  const hasAutoStartedRef = useRef(false);

  const handleTurnFinished = useCallback(() => {
    if (isVoiceModeActiveRef.current) startListeningRef.current();
  }, []);

  const voiceTurn = useVoiceTurn({
    onFinished: handleTurnFinished,
    onSettled: onTurnSettled,
    threadId: threadId ?? '',
  });
  const {
    agentTranscript,
    errorMessage: turnError,
    isRunning: isTurnRunning,
    isSpeaking: isTurnSpeaking,
    pendingApproval,
    respondToApproval,
    start: startVoiceTurn,
    stop: stopVoiceTurn,
  } = voiceTurn;

  const handleTranscript = useCallback(
    (text: string, recording: VoiceRecording | null) => {
      if (!isVoiceModeActiveRef.current) {
        setDictatedTranscript({ text, id: Date.now() }); // Dictate: let the user review first.
        return;
      }

      const messageId = randomUUID();

      silentRestartsRef.current = 0;
      startVoiceTurn(text, messageId);

      if (!recording || !threadId) return;

      uploadVoiceRecording({ messageId, recording, threadId })
        .then(() =>
          queryClient.invalidateQueries({ queryKey: threadQueryKeys.voiceAudio(threadId) })
        )
        .catch((error: unknown) => console.warn('[voice] Recording upload failed.', error));
    },
    [queryClient, startVoiceTurn, threadId]
  );

  const voice = useVoiceAssistant({
    isAgentRunning: isRunning,
    keepSessionOpenRef: isVoiceModeActiveRef,
    onTranscript: handleTranscript,
  });
  const voiceMode = useVoiceModeConversation({ voice });

  startListeningRef.current = voice.startListening;

  useEffect(() => {
    isVoiceModeActiveRef.current = voiceMode.isActive;
  }, [voiceMode.isActive]);

  // Set before start(): listening begins in this tick.
  const startVoiceMode = useCallback(() => {
    isVoiceModeActiveRef.current = true;
    voiceMode.start();
  }, [voiceMode.start]);

  const hasPendingApproval = pendingApproval !== null;

  const exitVoiceMode = useCallback(() => {
    isVoiceModeActiveRef.current = false;
    stopVoiceTurn();
    voiceMode.stop();

    if (hasPendingApproval) onExitWithPendingApproval?.();
  }, [hasPendingApproval, onExitWithPendingApproval, stopVoiceTurn, voiceMode.stop]);

  const isTurnActive = isTurnRunning || isTurnSpeaking;

  const onStopVoiceModeTurn = useCallback(() => {
    if (isTurnActive) {
      stopVoiceTurn();
      voice.startListening();
      return;
    }

    voice.stopListening();
  }, [isTurnActive, stopVoiceTurn, voice]);

  const previousSttStateRef = useRef(voice.voiceState);

  const sttState = voice.voiceState;
  const sttError = voice.errorMessage;
  const restartListening = voice.startListening;

  useEffect(() => {
    const previous = previousSttStateRef.current;
    previousSttStateRef.current = sttState;

    if (previous === sttState) return;
    if (!voiceMode.isActive || isTurnActive || pendingApproval) return;

    const endedSilently = sttState === VOICE_STATES.IDLE && VOICE_STT_SESSION_STATES.has(previous);
    const heardNothing =
      sttState === VOICE_STATES.ERROR && sttError === VOICE_ERROR_MESSAGES.NO_SPEECH;

    if (!endedSilently && !heardNothing) return;
    if (silentRestartsRef.current >= VOICE_MAX_SILENT_RESTARTS) return;

    silentRestartsRef.current += 1;
    restartListening();
  }, [isTurnActive, restartListening, sttError, sttState, voiceMode.isActive, pendingApproval]);

  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    if (!autoStart || !isReady || isHistoryLoading) return;

    hasAutoStartedRef.current = true;
    startVoiceMode();
  }, [autoStart, isReady, isHistoryLoading, startVoiceMode]);

  return {
    agentTranscript,
    dictatedTranscript,
    isVoiceModeActive: voiceMode.isActive,
    isVoiceTurnRunning: isTurnRunning,
    micLevel: voice.micLevel,
    onApprovalDecision: respondToApproval,
    onExitVoiceMode: exitVoiceMode,
    onStartListening: voice.startListening,
    onStartVoiceMode: startVoiceMode,
    onStopListening: voice.stopListening,
    onStopSpeaking: stopVoiceTurn,
    onStopVoiceModeTurn,
    partialTranscript: voice.partialTranscript,
    pendingApproval,
    voiceErrorMessage: turnError ?? sttError,
    voiceState: resolveServerVoiceState(voiceTurn, voice.voiceState),
  };
};
