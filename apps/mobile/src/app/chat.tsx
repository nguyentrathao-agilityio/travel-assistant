import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

// Services
import { createRemoteThread, generateThreadId } from '../services';
import { DASHBOARD_PATH } from '../constants';
import { goBackOrReplace } from '../utils/navigation';

// Components
import { ChatScreen } from '../screens';

// Hooks
import {
  useActiveThreadId,
  useAgentThreadHistory,
  useChatAgent,
  useChatSuggestions,
  useChatVoice,
  useInterruptElement,
  useTranscriptHistory,
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
  const {
    messages: liveMessages,
    isReady,
    isRunning,
    error,
    sendMessage,
    stop,
  } = useChatAgent(threadId);
  const interruptElement = useInterruptElement();
  const { isLoading: isAgentHistoryLoading, messages: historyMessages } =
    useAgentThreadHistory(threadId);
  const {
    fetchNewer,
    fetchOlder,
    hasNewer,
    hasOlder,
    isLoading: isTranscriptLoading,
    isLoadingOlder,
    messages,
    olderError,
    retryOlder,
  } = useTranscriptHistory(threadId, liveMessages, isRunning);
  const isHistoryLoading = isAgentHistoryLoading || isTranscriptLoading;
  const history = useMemo(
    () => ({
      hasNewer,
      hasOlder,
      isLoadingOlder,
      olderError,
      onLoadNewer: fetchNewer,
      onLoadOlder: fetchOlder,
      onRetryOlder: retryOlder,
    }),
    [hasNewer, hasOlder, isLoadingOlder, olderError, fetchNewer, fetchOlder, retryOlder]
  );
  useTravelActions({ selectFlight, selectHotel, sendMessage, state: tripState });

  const { suggestions } = useChatSuggestions({
    threadId,
    historyMessageCount: historyMessages.length,
    liveMessageCount: liveMessages.length,
    isRunning,
    isAwaitingApproval: interruptElement !== null,
  });

  const voice = useChatVoice({
    autoStart: params.focusVoice === '1',
    isHistoryLoading,
    isReady,
    isRunning,
    messages,
    sendMessage,
  });

  const handleBack = useCallback(() => {
    goBackOrReplace(router, DASHBOARD_PATH);
  }, [router]);

  return (
    <ChatScreen
      error={error}
      history={history}
      interruptElement={interruptElement}
      isReady={isReady && !isHistoryLoading}
      isRunning={isRunning}
      messages={messages}
      onBack={handleBack}
      onSend={sendMessage}
      onStop={stop}
      suggestions={suggestions}
      threadId={threadId}
      voice={voice}
    />
  );
}
