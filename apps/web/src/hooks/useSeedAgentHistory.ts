import { useEffect, useRef } from 'react';
import { useAgent } from '@copilotkit/react-core/v2';

import { AGENT_NAME } from '@/constants';
import type { AgUiMessage } from '@/types';
import { isRealConversationMessage } from '@/utils';

export const useSeedAgentHistory = (
  threadId: string,
  persistedMessages: AgUiMessage[],
  isHistoryLoading: boolean
): void => {
  const { agent } = useAgent({ agentId: AGENT_NAME });
  const messages = agent.messages;
  const seededThreadRef = useRef<string | null>(null);
  const hasRealLiveMessages = messages.some(isRealConversationMessage);

  useEffect(() => {
    if (isHistoryLoading || !threadId) return;

    if (seededThreadRef.current === threadId) return;
    seededThreadRef.current = threadId;

    if (hasRealLiveMessages || persistedMessages.length === 0) return;
    agent.setMessages(persistedMessages);
  }, [threadId, persistedMessages, isHistoryLoading, hasRealLiveMessages, agent]);
};
