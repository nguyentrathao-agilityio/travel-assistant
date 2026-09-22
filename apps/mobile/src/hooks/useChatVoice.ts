import { useCallback, useEffect, useRef, useState } from 'react';

// Constants
import { VOICE_STATES } from '../constants';

// Hooks
import { useVoiceAssistant } from './useVoiceAssistant';
import { useVoiceModeConversation } from './useVoiceModeConversation';

// Types
import type { VoiceState } from '../constants';
import type { Message } from '@copilotkit/react-native/headless';
import type { SharedValue } from 'react-native-reanimated';

interface UseChatVoiceOptions {
  autoStart: boolean;
  isHistoryLoading: boolean;
  isReady: boolean;
  isRunning: boolean;
  messages: Message[];
  sendMessage: (text: string) => void;
}

export interface ChatVoiceProps {
  dictatedTranscript: { text: string; id: number } | null;
  isVoiceModeActive: boolean;
  micLevel: SharedValue<number>;
  onExitVoiceMode: () => void;
  onStartListening: () => void;
  onStartVoiceMode: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onStopVoiceModeTurn: () => void;
  partialTranscript: string;
  voiceErrorMessage: string | null;
  voiceState: VoiceState;
}

// Owns the whole voice pipeline for the chat screen: dictate-to-composer, hands-free
// voice mode, and auto-starting listening when the route opened with focusVoice=1.
export const useChatVoice = ({
  autoStart,
  isHistoryLoading,
  isReady,
  isRunning,
  messages,
  sendMessage,
}: UseChatVoiceOptions): ChatVoiceProps => {
  const [dictatedTranscript, setDictatedTranscript] = useState<{
    text: string;
    id: number;
  } | null>(null);

  const isVoiceModeActiveRef = useRef(false);

  const handleTranscript = useCallback(
    (text: string) => {
      if (isVoiceModeActiveRef.current) {
        sendMessage(text); // Voice Mode: auto-send, the loop continues on its own.
        return;
      }

      setDictatedTranscript({ text, id: Date.now() }); // Dictate: let the user review first.
    },
    [sendMessage]
  );

  const voice = useVoiceAssistant({
    isAgentRunning: isRunning,
    isVoiceModeActiveRef,
    onTranscript: handleTranscript,
  });
  const voiceMode = useVoiceModeConversation({ isRunning, messages, voice });

  useEffect(() => {
    isVoiceModeActiveRef.current = voiceMode.isActive;
  }, [voiceMode.isActive]);

  const onStopVoiceModeTurn = useCallback(() => {
    if (voice.voiceState === VOICE_STATES.SPEAKING) {
      voice.stopSpeaking();
      return;
    }

    voice.stopListening();
  }, [voice]);

  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    if (!autoStart || !isReady || isHistoryLoading) return;

    hasAutoStartedRef.current = true;
    voice.startListening();
  }, [autoStart, isReady, isHistoryLoading, voice.startListening]);

  return {
    dictatedTranscript,
    isVoiceModeActive: voiceMode.isActive,
    micLevel: voice.micLevel,
    onExitVoiceMode: voiceMode.stop,
    onStartListening: voice.startListening,
    onStartVoiceMode: voiceMode.start,
    onStopListening: voice.stopListening,
    onStopSpeaking: voice.stopSpeaking,
    onStopVoiceModeTurn,
    partialTranscript: voice.partialTranscript,
    voiceErrorMessage: voice.errorMessage,
    voiceState: voice.voiceState,
  };
};
