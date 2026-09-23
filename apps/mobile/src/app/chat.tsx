import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

// Services
import { createRemoteThread, generateThreadId } from '../services';

// Components
import { ChatScreen } from '../screens';

// Hooks
import {
  useActiveThreadId,
  useChatAgent,
  useChatSuggestions,
  useChatVoice,
  useInterruptElement,
  useSeedAgentHistory,
  useThreadHistory,
  useTravelActions,
  useTripState,
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
  useTravelActions({ selectFlight, selectHotel, sendMessage, state: tripState });

  const { suggestions } = useChatSuggestions({
    isAwaitingApproval: interruptElement !== null,
    isRunning,
    messageCount: messages.length,
    state: tripState,
  });

  const voice = useChatVoice({
    autoStart: params.focusVoice === '1',
    isHistoryLoading,
    isReady,
    isRunning,
    messages,
    sendMessage,
  });

  return (
    <ChatScreen
      error={error}
      interruptElement={interruptElement}
      isReady={isReady && !isHistoryLoading}
      isRunning={isRunning}
      messages={messages}
      onBack={router.back}
      onSend={sendMessage}
      onStop={stop}
      suggestions={suggestions}
      voice={voice}
    />
  );
}
