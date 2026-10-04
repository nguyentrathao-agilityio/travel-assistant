import { useCallback, useState } from 'react';

// Types
import type { useVoiceAssistant } from './useVoiceAssistant';

interface UseVoiceModeConversationOptions {
  voice: Pick<ReturnType<typeof useVoiceAssistant>, 'cancelListening' | 'startListening'>;
}

interface UseVoiceModeConversationResult {
  isActive: boolean;
  start: () => void;
  stop: () => void;
}

// Hands-free mode on/off; the listen → reply → listen loop is driven by useVoiceTurn.
export const useVoiceModeConversation = ({
  voice,
}: UseVoiceModeConversationOptions): UseVoiceModeConversationResult => {
  const [isActive, setIsActive] = useState(false);
  const { cancelListening, startListening } = voice;

  const start = useCallback(() => {
    setIsActive(true);
    startListening();
  }, [startListening]);

  const stop = useCallback(() => {
    setIsActive(false);
    cancelListening();
  }, [cancelListening]);

  return { isActive, start, stop };
};
