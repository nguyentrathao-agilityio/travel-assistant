import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

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
  useWeatherAction,
} from '../hooks';
import { createRemoteThread, generateThreadId } from '../services';
import { ChatScreen } from '../screens';
import { messageText, renderableMessages } from '../utils/chatMessages';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ threadId?: string; focusVoice?: string }>();
  const router = useRouter();
  const threadIdRef = useRef(params.threadId ?? generateThreadId());
  const threadId = threadIdRef.current;
  const { markActive } = useActiveThreadId();

  useEffect(() => {
    createRemoteThread(threadId).catch(() => {
      // Sending a message will surface the same failure via useChatAgent's
      // error state — no need to duplicate the report here.
    });
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

  const pendingVoiceReplyRef = useRef(false);

  const handleTranscript = useCallback(
    (text: string) => {
      pendingVoiceReplyRef.current = true;
      sendMessage(text);
    },
    [sendMessage]
  );

  const voice = useVoiceAssistant({ isAgentRunning: isRunning, onTranscript: handleTranscript });

  // Speak the agent's reply once its run finishes, but only for a turn that
  // started by voice — a normal typed message should stay silent.
  const wasRunningRef = useRef(isRunning);

  useEffect(() => {
    const wasRunning = wasRunningRef.current;
    wasRunningRef.current = isRunning;

    if (!wasRunning || isRunning || !pendingVoiceReplyRef.current) return;

    pendingVoiceReplyRef.current = false;
    const lastAssistantMessage = renderableMessages(messages)
      .filter((message) => message.role === 'assistant')
      .at(-1);
    const replyText = lastAssistantMessage ? messageText(lastAssistantMessage.content) : '';

    if (replyText) voice.speak(replyText);
  }, [isRunning, messages, voice.speak]);

  const hasAutoStartedVoiceRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedVoiceRef.current) return;
    if (params.focusVoice !== '1' || !isReady || isHistoryLoading) return;

    hasAutoStartedVoiceRef.current = true;
    voice.startListening();
  }, [params.focusVoice, isReady, isHistoryLoading, voice.startListening]);

  return (
    <ChatScreen
      error={error}
      interruptElement={interruptElement}
      isReady={isReady && !isHistoryLoading}
      isRunning={isRunning}
      messages={messages}
      onBack={router.back}
      onSend={sendMessage}
      onStartListening={voice.startListening}
      onStop={stop}
      onStopListening={voice.stopListening}
      onStopSpeaking={voice.stopSpeaking}
      voiceErrorMessage={voice.errorMessage}
      voiceState={voice.voiceState}
    />
  );
}
