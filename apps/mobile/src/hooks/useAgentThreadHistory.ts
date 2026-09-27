import { useAgent } from '@copilotkit/react-native/headless';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { AGENT_NAME } from '@repo/constants';

import { fetchThreadValues } from '../services/threadHistory';
import { toAgUiMessage } from '../utils/langgraphMessage';
import { threadQueryKeys } from './threadQueryKeys';

import type { Message } from '@copilotkit/react-native/headless';
import type { LangGraphRawMessage, LangGraphThreadValues } from '../utils/langgraphMessage';

const EMPTY_MESSAGES: Message[] = [];
const isRealMessage = (message: Message): boolean =>
  message.role === 'user' || message.role === 'assistant' || message.role === 'tool';

export const useAgentThreadHistory = (threadId: string) => {
  const { agent } = useAgent({ agentId: AGENT_NAME });
  const activeThreadRef = useRef<string | null>(null);
  const query = useQuery({
    enabled: Boolean(threadId),
    queryFn: async () => {
      const values = await fetchThreadValues(threadId);
      const rawMessages = ((values as LangGraphThreadValues | undefined)?.messages ??
        []) as LangGraphRawMessage[];

      return rawMessages.flatMap((message, index) => {
        const converted = toAgUiMessage(message, `${threadId}:${index}`);

        return converted ? [converted] : [];
      });
    },
    queryKey: threadQueryKeys.history(threadId),
    retry: false,
  });

  const messages = query.data ?? EMPTY_MESSAGES;
  const isLoading = query.isPending && Boolean(threadId);

  useEffect(() => {
    if (activeThreadRef.current === threadId) return;
    activeThreadRef.current = threadId;

    if (agent.messages.length > 0) agent.setMessages([]);
  }, [threadId, agent]);

  const hasRealLiveMessages = agent.messages.some(isRealMessage);

  useEffect(() => {
    if (isLoading || !threadId || activeThreadRef.current !== threadId) return;
    if (hasRealLiveMessages || messages.length === 0) return;

    const timeout = setTimeout(() => agent.setMessages(messages), 0);

    return () => clearTimeout(timeout);
  }, [threadId, messages, isLoading, hasRealLiveMessages, agent]);

  return { messages, isLoading };
};
