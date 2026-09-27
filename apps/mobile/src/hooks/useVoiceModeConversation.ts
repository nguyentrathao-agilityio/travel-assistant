import { useCallback, useEffect, useRef, useState } from 'react';

// Constants
import { VOICE_STATES } from '../constants';

// Utils
import { messageText, renderableMessages } from '../utils/chatMessages';
import {
  collectStreamingSpeech,
  createStreamingSpeechState,
  resetStreamingSpeech,
} from '../utils/voice';

// Types
import type { useVoiceAssistant } from './useVoiceAssistant';
import type { Message } from '@copilotkit/react-native/headless';

interface UseVoiceModeConversationOptions {
  voice: ReturnType<typeof useVoiceAssistant>;
  messages: Message[];
  isRunning: boolean;
}

interface UseVoiceModeConversationResult {
  isActive: boolean;
  start: () => void;
  stop: () => void;
}

// Hands-free loop: completed sentences are spoken while the agent streams, and
// listening resumes only after both the agent and speech queue finish. Doesn't
// auto-retry from the `error` voice state.
export const useVoiceModeConversation = ({
  voice,
  messages,
  isRunning,
}: UseVoiceModeConversationOptions): UseVoiceModeConversationResult => {
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const wasRunningRef = useRef(isRunning);
  const speechStateRef = useRef(createStreamingSpeechState());
  const { cancelListening, enqueueSpeech, flushSpeech, startListening, stopSpeaking, voiceState } =
    voice;

  useEffect(() => {
    const wasRunning = wasRunningRef.current;
    wasRunningRef.current = isRunning;

    if (!isActiveRef.current || (!wasRunning && !isRunning)) return;

    const lastMessage = renderableMessages(messages).at(-1);

    if (lastMessage?.role !== 'assistant') {
      if (wasRunning && !isRunning) startListening();
      return;
    }

    const update = collectStreamingSpeech(speechStateRef.current, {
      isComplete: !isRunning,
      messageId: lastMessage.id,
      text: messageText(lastMessage.content),
    });
    speechStateRef.current = update.state;

    for (const segment of update.segments) enqueueSpeech(segment);
    if (update.segments.length > 0) flushSpeech();

    const finishedWithNoPendingSpeech =
      wasRunning &&
      !isRunning &&
      update.segments.length === 0 &&
      voiceState !== VOICE_STATES.SPEAKING;

    if (finishedWithNoPendingSpeech) startListening();
  }, [enqueueSpeech, flushSpeech, isRunning, messages, startListening, voiceState]);

  const wasSpeakingRef = useRef(voiceState === VOICE_STATES.SPEAKING);

  useEffect(() => {
    const wasSpeaking = wasSpeakingRef.current;
    wasSpeakingRef.current = voiceState === VOICE_STATES.SPEAKING;

    if (!isActiveRef.current || !wasSpeaking || isRunning) return;
    if (voiceState === VOICE_STATES.IDLE) startListening();
  }, [isRunning, startListening, voiceState]);

  const start = useCallback(() => {
    speechStateRef.current = resetStreamingSpeech();
    wasRunningRef.current = isRunning;
    setIsActive(true);
    startListening();
  }, [isRunning, startListening]);

  const stop = useCallback(() => {
    speechStateRef.current = resetStreamingSpeech();
    wasRunningRef.current = isRunning;
    setIsActive(false);
    cancelListening();
    stopSpeaking();
  }, [cancelListening, isRunning, stopSpeaking]);

  return { isActive, start, stop };
};
