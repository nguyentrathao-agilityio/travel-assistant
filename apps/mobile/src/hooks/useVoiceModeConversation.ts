import { useCallback, useEffect, useRef, useState } from 'react';

// Constants
import { VOICE_STATES } from '../constants';

// Utils
import { messageText, renderableMessages } from '../utils/chatMessages';

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

// Hands-free loop: a finished agent turn is spoken aloud, then speaking done
// resumes listening. Doesn't auto-retry from the `error` voice state.
export const useVoiceModeConversation = ({
  voice,
  messages,
  isRunning,
}: UseVoiceModeConversationOptions): UseVoiceModeConversationResult => {
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const wasRunningRef = useRef(isRunning);

  useEffect(() => {
    const wasRunning = wasRunningRef.current;
    wasRunningRef.current = isRunning;

    if (!isActiveRef.current || !wasRunning || isRunning) return;

    const lastMessage = renderableMessages(messages).at(-1);
    const text = lastMessage?.role === 'assistant' ? messageText(lastMessage.content).trim() : '';

    if (text) {
      voice.speak(text);
    } else {
      voice.startListening();
    }
  }, [isRunning, messages, voice]);

  const wasSpeakingRef = useRef(voice.voiceState === VOICE_STATES.SPEAKING);

  useEffect(() => {
    const wasSpeaking = wasSpeakingRef.current;
    wasSpeakingRef.current = voice.voiceState === VOICE_STATES.SPEAKING;

    if (!isActiveRef.current || !wasSpeaking) return;
    if (voice.voiceState === VOICE_STATES.IDLE) voice.startListening();
  }, [voice]);

  const start = useCallback(() => {
    setIsActive(true);
    voice.startListening();
  }, [voice]);

  const stop = useCallback(() => {
    setIsActive(false);
    voice.stopListening();
    voice.stopSpeaking();
  }, [voice]);

  return { isActive, start, stop };
};
