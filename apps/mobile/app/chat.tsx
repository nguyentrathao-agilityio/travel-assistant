import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ChatScreen } from '../src/components';
import {
  useActiveThreadId,
  useChatAgent,
  useLocalTipsAction,
  usePlacesAction,
  useRouteAction,
  useTripState,
  useWeatherAction,
} from '../src/hooks';
import { createRemoteThread, generateThreadId } from '../src/services';

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

  useTripState(threadId);
  useWeatherAction();
  usePlacesAction();
  useRouteAction();
  useLocalTipsAction();
  const { messages, isReady, isRunning, error, sendMessage, stop } = useChatAgent(threadId);

  return (
    <ChatScreen
      error={error}
      isReady={isReady}
      isRunning={isRunning}
      messages={messages}
      onSend={sendMessage}
      onStop={stop}
    />
  );
}
