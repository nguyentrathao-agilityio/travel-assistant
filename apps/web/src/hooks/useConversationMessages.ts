import { createElement, useMemo, useRef } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { useLazyToolRenderer } from '@copilotkit/react-core';

import { CHAT_ROLE } from '@/constants';
import {
  reconcileConversationMessages,
  type ConversationChatMessage,
} from '@/utils/conversationMessages';

export { normalizeConversationMessages } from '@/utils/conversationMessages';
export type { ConversationChatMessage } from '@/utils/conversationMessages';

/**
 * Reconciles CopilotKit's live message stream with LangGraph's persisted
 * snapshot after a resume. Not a CopilotKit hook-version issue — don't
 * "fix" this by migrating useCoAgent/useLangGraphInterrupt.
 */

type ChatMessage = MessagesProps['messages'][number];

const attachGenerativeUi = (
  messages: ChatMessage[],
  lazyToolRendered: ReturnType<typeof useLazyToolRenderer>
): ChatMessage[] =>
  messages.map((message) => {
    if (message.role !== CHAT_ROLE.ASSISTANT) return message;

    const toolCalls = message.toolCalls ?? [];

    if (toolCalls.length === 0) return message;

    const renderedNodes = toolCalls
      .map((toolCall) => lazyToolRendered({ ...message, toolCalls: [toolCall] }, messages)?.())
      .filter((node) => node !== null && node !== undefined);

    if (renderedNodes.length === 0) return message;

    const resolved: ConversationChatMessage = {
      ...message,
      generativeUI: () => createElement('div', { className: 'flex flex-col gap-3' }, renderedNodes),
      hasResolvedToolCard: true,
    };

    return resolved;
  });

export const useConversationMessages = (
  messages: ChatMessage[],
  conversationId?: string | null,
  inProgress = false
): ChatMessage[] => {
  const lazyToolRendered = useLazyToolRenderer();
  const previousMessagesRef = useRef<ConversationChatMessage[]>([]);
  const conversationIdRef = useRef(conversationId);

  if (conversationIdRef.current !== conversationId) {
    // Prevent cached content from leaking across conversation boundaries.
    conversationIdRef.current = conversationId;
    previousMessagesRef.current = [];
  }

  return useMemo(() => {
    const reconciled = reconcileConversationMessages(messages, {
      previousMessages: previousMessagesRef.current,
      inProgress,
    });

    // Attach resolved tool cards only after message content and ordering are stable.
    const messagesWithGenerativeUi = attachGenerativeUi(reconciled, lazyToolRendered);

    previousMessagesRef.current = messagesWithGenerativeUi;

    return messagesWithGenerativeUi;
  }, [conversationId, inProgress, messages, lazyToolRendered]);
};
