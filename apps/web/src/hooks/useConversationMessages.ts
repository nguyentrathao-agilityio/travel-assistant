import { createElement, useMemo, useRef } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { useLazyToolRenderer } from '@copilotkit/react-core';

// Constants
import { CHAT_ROLE, TOOL_NAMES } from '@/constants';

/**
 * Reconciles CopilotKit's live message stream with LangGraph's persisted
 * snapshot after a resume. Not a CopilotKit hook-version issue — don't
 * "fix" this by migrating useCoAgent/useLangGraphInterrupt.
 */

type ChatMessage = MessagesProps['messages'][number];
type AssistantChatMessage = Extract<ChatMessage, { role: 'assistant' }>;

export type ConversationChatMessage = ChatMessage & { hasResolvedToolCard?: boolean };
type ResolvedToolCardMessage = AssistantChatMessage & { hasResolvedToolCard: true };

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

const findLastUserMessageIndex = (messages: ChatMessage[]): number => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === CHAT_ROLE.USER) return index;
  }

  return -1;
};

const isResolvedToolCardMessage = (
  message: ConversationChatMessage
): message is ResolvedToolCardMessage =>
  message.role === CHAT_ROLE.ASSISTANT &&
  message.hasResolvedToolCard === true &&
  Boolean(message.toolCalls?.length);

/**
 * Reconciles the persisted LangGraph snapshot with CopilotKit's live messages.
 * Live messages take precedence when both sources contain the same message ID.
 */
export const normalizeConversationMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const seenMessageIds = new Set<string>();
  const seenToolCallIds = new Set<string>();
  const seenBookingToolCalls = new Set<string>();
  const result: ChatMessage[] = [];
  const resultIndexByMessageId = new Map<string, number>();

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.id && seenMessageIds.has(message.id)) {
      const resultIndex = resultIndexByMessageId.get(message.id);
      const latestMessage = resultIndex === undefined ? undefined : result[resultIndex];

      if (
        resultIndex !== undefined &&
        latestMessage?.role === CHAT_ROLE.ASSISTANT &&
        message.role === CHAT_ROLE.ASSISTANT &&
        !latestMessage.content &&
        typeof message.content === 'string' &&
        message.content
      ) {
        result[resultIndex] = { ...latestMessage, content: message.content };
      }

      continue;
    }

    const pushMessage = (nextMessage: ChatMessage) => {
      if (nextMessage.id) {
        seenMessageIds.add(nextMessage.id);
        resultIndexByMessageId.set(nextMessage.id, result.length);
      }

      result.push(nextMessage);
    };

    if (message.role === CHAT_ROLE.USER) {
      seenBookingToolCalls.clear();
      pushMessage(message);
      continue;
    }

    if (message.role !== CHAT_ROLE.ASSISTANT) {
      pushMessage(message);
      continue;
    }

    if (!message.toolCalls?.length) {
      if (message.content) {
        pushMessage(message);
      }

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
      pushMessage({ ...message, toolCalls });
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
  messages: ChatMessage[],
  conversationId?: string | null,
  inProgress = false
): ChatMessage[] => {
  const lazyToolRendered = useLazyToolRenderer();
  const assistantContentByIdRef = useRef(new Map<string, string>());
  const previousMessagesRef = useRef<ConversationChatMessage[]>([]);
  const conversationIdRef = useRef(conversationId);

  if (conversationIdRef.current !== conversationId) {
    conversationIdRef.current = conversationId;
    assistantContentByIdRef.current.clear();
    previousMessagesRef.current = [];
  }

  return useMemo(() => {
    const normalized = normalizeConversationMessages(messages);
    const contentReconciled = normalized.map((message) => {
      if (message.role !== CHAT_ROLE.ASSISTANT || !message.id) return message;

      if (typeof message.content === 'string' && message.content.trim()) {
        assistantContentByIdRef.current.set(message.id, message.content);

        return message;
      }

      const previousContent = assistantContentByIdRef.current.get(message.id);

      if (!message.toolCalls?.length || !previousContent) return message;

      return { ...message, content: previousContent };
    });

    let reconciled = contentReconciled;

    if (inProgress) {
      const currentUserIndex = findLastUserMessageIndex(contentReconciled);
      const previousUserIndex = findLastUserMessageIndex(previousMessagesRef.current);
      const currentUserId = contentReconciled[currentUserIndex]?.id;
      const previousUserId = previousMessagesRef.current[previousUserIndex]?.id;
      const currentTurnHasVisibleAssistantText = contentReconciled
        .slice(currentUserIndex + 1)
        .some(
          (message) =>
            message.role === CHAT_ROLE.ASSISTANT &&
            typeof message.content === 'string' &&
            message.content.trim()
        );

      if (
        currentUserIndex !== -1 &&
        currentUserId &&
        currentUserId === previousUserId &&
        !currentTurnHasVisibleAssistantText
      ) {
        const currentIds = new Set(contentReconciled.map((message) => message.id));
        const missingVisibleAssistantMessages = previousMessagesRef.current
          .slice(previousUserIndex + 1)
          .filter(
            (message) =>
              message.role === CHAT_ROLE.ASSISTANT &&
              typeof message.content === 'string' &&
              message.content.trim() &&
              !currentIds.has(message.id)
          );

        if (missingVisibleAssistantMessages.length) {
          reconciled = [
            ...contentReconciled.slice(0, currentUserIndex + 1),
            ...missingVisibleAssistantMessages,
            ...contentReconciled.slice(currentUserIndex + 1),
          ];
        }
      }

      if (currentUserIndex !== -1 && currentUserId && currentUserId === previousUserId) {
        const currentToolCallIds = new Set(
          reconciled.flatMap((message) =>
            message.role === CHAT_ROLE.ASSISTANT
              ? (message.toolCalls?.map(({ id }) => id) ?? [])
              : []
          )
        );
        const missingCardMessages = previousMessagesRef.current
          .slice(previousUserIndex + 1)
          .filter(isResolvedToolCardMessage)
          .filter((message) => message.toolCalls?.some(({ id }) => !currentToolCallIds.has(id)))
          .map((message) => ({
            ...message,
            content: '',
            toolCalls: message.toolCalls?.filter(({ id }) => !currentToolCallIds.has(id)),
          }));

        const retainedCardMessages: ResolvedToolCardMessage[] = [];

        for (const previousCardMessage of missingCardMessages) {
          const matchingMessageIndex = reconciled.findIndex(
            ({ id }) => id && id === previousCardMessage.id
          );

          if (matchingMessageIndex === -1) {
            retainedCardMessages.push(previousCardMessage);
            continue;
          }

          const matchingMessage = reconciled[matchingMessageIndex];

          if (matchingMessage.role !== CHAT_ROLE.ASSISTANT) continue;
          reconciled = reconciled.map((message, index) =>
            index === matchingMessageIndex
              ? {
                  ...message,
                  toolCalls: [
                    ...(matchingMessage.toolCalls ?? []),
                    ...(previousCardMessage.toolCalls ?? []),
                  ],
                }
              : message
          );
        }

        if (retainedCardMessages.length) {
          reconciled = [
            ...reconciled.slice(0, currentUserIndex + 1),
            ...retainedCardMessages,
            ...reconciled.slice(currentUserIndex + 1),
          ];
        }
      }
    }

    const messagesWithGenerativeUi = attachGenerativeUi(reconciled, lazyToolRendered);

    previousMessagesRef.current = messagesWithGenerativeUi;

    return messagesWithGenerativeUi;
  }, [conversationId, inProgress, messages, lazyToolRendered]);
};
