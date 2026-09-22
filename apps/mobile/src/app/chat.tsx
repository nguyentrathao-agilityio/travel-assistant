import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

// Services
import { createRemoteThread, generateThreadId } from '../services';

// Constants
import { VOICE_STATES } from '../constants';

// Components
import { ChatScreen } from '../screens';

// Hooks
import {
  useActiveThreadId,
  useBookingAction,
  useChatAgent,
  useDestinationExplorerAction,
  useFlightAction,
  useHotelAction,
  useInterruptElement,
  useLocalTipsAction,
  usePlacesAction,
  useRouteAction,
  useSeedAgentHistory,
  useThemeAction,
  useThreadHistory,
  useTripState,
  useTripSummaryAction,
  useVoiceAssistant,
  useVoiceModeConversation,
  useWeatherAction,
} from '../hooks';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ threadId?: string; focusVoice?: string }>();
  const router = useRouter();
  const threadIdRef = useRef(params.threadId ?? generateThreadId());
  const threadId = threadIdRef.current;
  const { markActive } = useActiveThreadId();

  useEffect(() => {
    const prewarmThread = async () => {
      try {
        await createRemoteThread(threadId);
      } catch (caught) {
        console.warn('[chat] Failed to prewarm remote thread', caught);
      }
    };

    prewarmThread();
    markActive(threadId);
  }, [threadId, markActive]);

  const { state: tripState, selectFlight, selectHotel } = useTripState(threadId);
  const { messages, isReady, isRunning, error, sendMessage, stop } = useChatAgent(threadId);
  const interruptElement = useInterruptElement();
  const { messages: persistedMessages, isLoading: isHistoryLoading } = useThreadHistory(threadId);

  useSeedAgentHistory(threadId, persistedMessages, isHistoryLoading);

  useWeatherAction();
  usePlacesAction();
  useRouteAction();
  useLocalTipsAction();
  useDestinationExplorerAction();
  useFlightAction({ selectFlight, sendMessage, state: tripState });
  useHotelAction({ selectHotel, sendMessage, state: tripState });
  useBookingAction();
  useTripSummaryAction({ state: tripState });
  useThemeAction();

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

  const handleStopVoiceModeTurn = useCallback(() => {
    if (voice.voiceState === VOICE_STATES.SPEAKING) {
      voice.stopSpeaking();
      return;
    }

    voice.stopListening();
  }, [voice]);

  const hasAutoStartedVoiceRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedVoiceRef.current) return;
    if (params.focusVoice !== '1' || !isReady || isHistoryLoading) return;

    hasAutoStartedVoiceRef.current = true;
    voice.startListening();
  }, [params.focusVoice, isReady, isHistoryLoading, voice.startListening]);

  return (
    <ChatScreen
      dictatedTranscript={dictatedTranscript}
      error={error}
      interruptElement={interruptElement}
      isReady={isReady && !isHistoryLoading}
      isRunning={isRunning}
      isVoiceModeActive={voiceMode.isActive}
      messages={messages}
      micLevel={voice.micLevel}
      onBack={router.back}
      onExitVoiceMode={voiceMode.stop}
      onSend={sendMessage}
      onStartListening={voice.startListening}
      onStartVoiceMode={voiceMode.start}
      onStop={stop}
      onStopListening={voice.stopListening}
      onStopSpeaking={voice.stopSpeaking}
      onStopVoiceModeTurn={handleStopVoiceModeTurn}
      partialTranscript={voice.partialTranscript}
      voiceErrorMessage={voice.errorMessage}
      voiceState={voice.voiceState}
    />
  );
}
