import { useEffect, useRef } from 'react';
import { useAgent } from '@copilotkit/react-core/v2';

import { AGENT_NAME } from '@/constants';
import type { AgUiMessage } from '@/types';
import { isRealConversationMessage } from '@/utils';

/* CopilotKit's LangGraphAgent never implements connect(), so on mount its live
 * message array stays empty instead of auto-restoring from persisted history —
 * this hook seeds it manually, once per thread. */
export const useSeedAgentHistory = (
  threadId: string,
  persistedMessages: AgUiMessage[],
  isHistoryLoading: boolean
): void => {
  const { agent } = useAgent({ agentId: AGENT_NAME, threadId });
  const messages = agent.messages;
  const seededThreadRef = useRef<string | null>(null);
  const hasRealLiveMessages = messages.some(isRealConversationMessage);

  useEffect(() => {
    if (isHistoryLoading || !threadId) return;
    // Mark seeded before the early-return below so a thread with no history to seed isn't retried every render.
    if (seededThreadRef.current === threadId) return;
    seededThreadRef.current = threadId;

    if (hasRealLiveMessages || persistedMessages.length === 0) return;
    agent.setMessages(persistedMessages);
  }, [threadId, persistedMessages, isHistoryLoading, hasRealLiveMessages, agent]);
};
