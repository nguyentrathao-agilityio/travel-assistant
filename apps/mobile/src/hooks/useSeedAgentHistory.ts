import { useAgent } from '@copilotkit/react-native/headless';
import { useEffect, useRef } from 'react';

// Constants
import { AGENT_NAME } from '@repo/constants';

// Types
import type { Message } from '@copilotkit/react-native/headless';

const isRealMessage = (message: Message): boolean =>
  message.role === 'user' || message.role === 'assistant' || message.role === 'tool';

export const useSeedAgentHistory = (
  threadId: string,
  persistedMessages: Message[],
  isHistoryLoading: boolean
): void => {
  const { agent } = useAgent({ agentId: AGENT_NAME });
  const activeThreadRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeThreadRef.current === threadId) return;
    activeThreadRef.current = threadId;

    if (agent.messages.length > 0) agent.setMessages([]);
  }, [threadId, agent]);

  const messages = agent.messages;
  const hasRealLiveMessages = messages.some(isRealMessage);

  useEffect(() => {
    if (isHistoryLoading || !threadId || activeThreadRef.current !== threadId) return;
    if (hasRealLiveMessages || persistedMessages.length === 0) return;

    const timeout = setTimeout(() => agent.setMessages(persistedMessages), 0);

    return () => clearTimeout(timeout);
  }, [threadId, persistedMessages, isHistoryLoading, hasRealLiveMessages, agent]);
};
