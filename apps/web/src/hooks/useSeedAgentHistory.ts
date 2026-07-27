import { useEffect, useRef } from 'react';
import { useCopilotChatHeadless_c } from '@copilotkit/react-core';

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
  const { messages, setMessages } = useCopilotChatHeadless_c();
  const seededThreadRef = useRef<string | null>(null);
  const hasRealLiveMessages = messages.some(isRealConversationMessage);

  useEffect(() => {
    if (isHistoryLoading || !threadId) return;
    // Mark seeded before the early-return below so a thread with no history to seed isn't retried every render.
    if (seededThreadRef.current === threadId) return;
    seededThreadRef.current = threadId;

    if (hasRealLiveMessages || persistedMessages.length === 0) return;
    setMessages(persistedMessages);
  }, [threadId, persistedMessages, isHistoryLoading, hasRealLiveMessages, setMessages]);
};
