import { createElement, useMemo } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { useLazyToolRenderer } from '@copilotkit/react-core';

import { CHAT_ROLE, TOOL_NAMES } from '@/constants';

type ChatMessage = MessagesProps['messages'][number];

export type ConversationChatMessage = ChatMessage & { hasResolvedToolCard?: boolean };

const BOOKING_TOOL_NAMES = new Set<string>([
  TOOL_NAMES.BOOK_FLIGHT,
  TOOL_NAMES.BOOK_HOTEL,
  TOOL_NAMES.CANCEL_BOOKING,
]);

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)])
  );
};

const canonicalToolArguments = (toolArguments: string): string => {
  try {
    return JSON.stringify(canonicalize(JSON.parse(toolArguments) as unknown));
  } catch {
    return toolArguments;
  }
};

const bookingToolCallSignature = (toolName: string, toolArguments: string): string =>
  `${toolName}:${canonicalToolArguments(toolArguments)}`;

/**
 * Reconciles the persisted LangGraph snapshot with CopilotKit's live messages.
 * Live messages take precedence when both sources contain the same message ID.
 */
export const reconcileConversationMessages = (
  persistedMessages: ChatMessage[],
  liveMessages: ChatMessage[]
): ChatMessage[] => {
  const combined = [...persistedMessages, ...liveMessages];
  const seenMessageIds = new Set<string>();
  const seenToolCallIds = new Set<string>();
  const seenBookingToolCalls = new Set<string>();
  const result: ChatMessage[] = [];

  for (let index = combined.length - 1; index >= 0; index -= 1) {
    const message = combined[index];

    if (message.id) {
      if (seenMessageIds.has(message.id)) continue;
      seenMessageIds.add(message.id);
    }

    if (message.role === CHAT_ROLE.USER) {
      seenBookingToolCalls.clear();
      result.push(message);
      continue;
    }

    if (message.role !== CHAT_ROLE.ASSISTANT) {
      result.push(message);
      continue;
    }

    if (!message.toolCalls?.length) {
      if (message.content) result.push(message);
      continue;
    }

    const toolCalls = message.toolCalls.filter((toolCall) => {
      if (seenToolCallIds.has(toolCall.id)) return false;

      seenToolCallIds.add(toolCall.id);
      const { name, arguments: toolArguments } = toolCall.function;

      if (!BOOKING_TOOL_NAMES.has(name)) return true;

      const signature = bookingToolCallSignature(name, toolArguments);
      if (seenBookingToolCalls.has(signature)) return false;

      seenBookingToolCalls.add(signature);
      return true;
    });

    if (toolCalls.length || message.content) {
      result.push({ ...message, toolCalls });
    }
  }

  return result.reverse();
};

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
  persistedMessages: ChatMessage[],
  liveMessages: ChatMessage[]
): ChatMessage[] => {
  const lazyToolRendered = useLazyToolRenderer();

  return useMemo(() => {
    const reconciled = reconcileConversationMessages(persistedMessages, liveMessages);
    return attachGenerativeUi(reconciled, lazyToolRendered);
  }, [persistedMessages, liveMessages, lazyToolRendered]);
};
