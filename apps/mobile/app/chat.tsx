import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ChatScreen } from '../src/components';
import { useChatAgent } from '../src/hooks';
import { createRemoteThread, generateThreadId } from '../src/services';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ threadId?: string; focusVoice?: string }>();
  const threadIdRef = useRef(params.threadId ?? generateThreadId());
  const threadId = threadIdRef.current;

  // Idempotent: `ifExists: 'do_nothing'` means this is a no-op when the
  // dashboard already created the thread (Start new trip / Continue last
  // trip), and creates it lazily otherwise (e.g. Ask by voice, which passes
  // no threadId yet).
  useEffect(() => {
    createRemoteThread(threadId).catch(() => {
      // Sending a message will surface the same failure via useChatAgent's
      // error state — no need to duplicate the report here.
    });
  }, [threadId]);

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
