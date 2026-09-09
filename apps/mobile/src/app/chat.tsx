import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ChatScreen } from '../components';
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
  useThreadHistory,
  useTripState,
  useTripSummaryAction,
  useWeatherAction,
} from '../hooks';
import { createRemoteThread, generateThreadId } from '../services';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ threadId?: string; focusVoice?: string }>();
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

  return (
    <ChatScreen
      error={error}
      interruptElement={interruptElement}
      isReady={isReady && !isHistoryLoading}
      isRunning={isRunning}
      messages={messages}
      onSend={sendMessage}
      onStop={stop}
    />
  );
}
