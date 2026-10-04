import { useAgent } from '@copilotkit/react-native/headless';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { AGENT_NAME } from '@repo/constants';

import { fetchThreadValues } from '../services/threadHistory';
import { toAgUiMessages } from '../utils/langgraphMessage';
import { threadQueryKeys } from './threadQueryKeys';

import type { Message } from '@copilotkit/react-native/headless';

const EMPTY_MESSAGES: Message[] = [];
const isRealMessage = (message: Message): boolean =>
  message.role === 'user' || message.role === 'assistant' || message.role === 'tool';

export const useAgentThreadHistory = (threadId: string) => {
  const { agent } = useAgent({ agentId: AGENT_NAME });
  const queryClient = useQueryClient();
  const activeThreadRef = useRef<string | null>(null);
  const query = useQuery({
    enabled: Boolean(threadId),
    queryFn: async () => toAgUiMessages(threadId, await fetchThreadValues(threadId)),
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

  const reloadThread = useCallback(async () => {
    agent.setMessages(toAgUiMessages(threadId, await fetchThreadValues(threadId)));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: threadQueryKeys.history(threadId) }),
      queryClient.invalidateQueries({ queryKey: threadQueryKeys.transcript(threadId) }),
    ]);
  }, [agent, queryClient, threadId]);

  return { messages, isLoading, reloadThread };
};
