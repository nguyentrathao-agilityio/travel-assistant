import type { MessagesProps } from '@copilotkit/react-ui';

import { CHAT_ROLE } from '@/constants/agent';
import { TOOL_NAMES } from '@/constants/tools';

export type ChatMessage = MessagesProps['messages'][number];
type AssistantChatMessage = Extract<ChatMessage, { role: 'assistant' }>;

export type ConversationChatMessage = ChatMessage & { hasResolvedToolCard?: boolean };
type ResolvedToolCardMessage = AssistantChatMessage & { hasResolvedToolCard: true };

interface ReconcileConversationMessagesOptions {
  previousMessages?: ConversationChatMessage[];
  inProgress?: boolean;
}

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

const findLastUserMessageIndex = (messages: ConversationChatMessage[]): number => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === CHAT_ROLE.USER) return index;
  }

  return -1;
};

const isVisibleAssistantMessage = (message: ConversationChatMessage): boolean =>
  message.role === CHAT_ROLE.ASSISTANT &&
  typeof message.content === 'string' &&
  Boolean(message.content.trim());

const isResolvedToolCardMessage = (
  message: ConversationChatMessage
): message is ResolvedToolCardMessage =>
  message.role === CHAT_ROLE.ASSISTANT &&
  message.hasResolvedToolCard === true &&
  Boolean(message.toolCalls?.length);

/**
 * Deduplicates replayed messages while preserving the newest live representation.
 */
export const normalizeConversationMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const seenMessageIds = new Set<string>();
  const seenToolCallIds = new Set<string>();
  const seenToolResultCallIds = new Set<string>();
  const seenBookingToolCalls = new Set<string>();
  const result: ChatMessage[] = [];
  const resultIndexByMessageId = new Map<string, number>();

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role === CHAT_ROLE.TOOL) {
      if (seenToolResultCallIds.has(message.toolCallId)) continue;
      seenToolResultCallIds.add(message.toolCallId);
    }

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
      if (message.content) pushMessage(message);
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

    if (toolCalls.length || message.content) pushMessage({ ...message, toolCalls });
  }

  return result.reverse();
};

const restoreAssistantContent = (
  messages: ConversationChatMessage[],
  previousMessages: ConversationChatMessage[]
): ConversationChatMessage[] => {
  const previousContentById = new Map(
    previousMessages.flatMap((message) =>
      message.role === CHAT_ROLE.ASSISTANT &&
      message.id &&
      typeof message.content === 'string' &&
      message.content.trim()
        ? [[message.id, message.content] as const]
        : []
    )
  );

  return messages.map((message) => {
    if (
      message.role !== CHAT_ROLE.ASSISTANT ||
      !message.id ||
      !message.toolCalls?.length ||
      (typeof message.content === 'string' && message.content.trim())
    ) {
      return message;
    }

    const previousContent = previousContentById.get(message.id);
    return previousContent ? { ...message, content: previousContent } : message;
  });
};

const mergeMissingCardCalls = (
  messages: ConversationChatMessage[],
  previousTurn: ConversationChatMessage[],
  currentToolCallIds: Set<string>
): ConversationChatMessage[] => {
  const result = [...messages];
  const retainedMessages: ResolvedToolCardMessage[] = [];

  for (const previousMessage of previousTurn.filter(isResolvedToolCardMessage)) {
    const missingToolCalls = previousMessage.toolCalls?.filter(
      ({ id }) => !currentToolCallIds.has(id)
    );

    if (!missingToolCalls?.length) continue;

    const matchingIndex = result.findIndex(({ id }) => id && id === previousMessage.id);
    const retainedMessage = { ...previousMessage, content: '', toolCalls: missingToolCalls };

    if (matchingIndex === -1) {
      retainedMessages.push(retainedMessage);
      continue;
    }

    const matchingMessage = result[matchingIndex];
    if (matchingMessage.role !== CHAT_ROLE.ASSISTANT) continue;

    result[matchingIndex] = {
      ...matchingMessage,
      toolCalls: [...(matchingMessage.toolCalls ?? []), ...missingToolCalls],
    };
  }

  if (!retainedMessages.length) return result;

  const currentUserIndex = findLastUserMessageIndex(result);
  return [
    ...result.slice(0, currentUserIndex + 1),
    ...retainedMessages,
    ...result.slice(currentUserIndex + 1),
  ];
};

/**
 * Reconciles transient streaming snapshots without allowing visible current-turn
 * text or terminal tool results to regress while the run is active.
 */
export const reconcileConversationMessages = (
  messages: ChatMessage[],
  { previousMessages = [], inProgress = false }: ReconcileConversationMessagesOptions = {}
): ConversationChatMessage[] => {
  const normalized = restoreAssistantContent(
    normalizeConversationMessages(messages),
    previousMessages
  );

  if (!inProgress) return normalized;

  const currentUserIndex = findLastUserMessageIndex(normalized);
  const previousUserIndex = findLastUserMessageIndex(previousMessages);
  const currentUserId = normalized[currentUserIndex]?.id;
  const previousUserId = previousMessages[previousUserIndex]?.id;

  if (currentUserIndex === -1 || !currentUserId || currentUserId !== previousUserId) {
    return normalized;
  }

  const previousTurn = previousMessages.slice(previousUserIndex + 1);
  let reconciled = [...normalized];

  if (!normalized.slice(currentUserIndex + 1).some(isVisibleAssistantMessage)) {
    const currentMessageIds = new Set(normalized.map(({ id }) => id));
    const missingVisibleMessages = previousTurn.filter(
      (message) => isVisibleAssistantMessage(message) && !currentMessageIds.has(message.id)
    );

    if (missingVisibleMessages.length) {
      reconciled = [
        ...normalized.slice(0, currentUserIndex + 1),
        ...missingVisibleMessages,
        ...normalized.slice(currentUserIndex + 1),
      ];
    }
  }

  const currentToolCallIds = new Set(
    reconciled.flatMap((message) =>
      message.role === CHAT_ROLE.ASSISTANT ? (message.toolCalls?.map(({ id }) => id) ?? []) : []
    )
  );
  const currentToolResultIds = new Set(
    reconciled.flatMap((message) => (message.role === CHAT_ROLE.TOOL ? [message.toolCallId] : []))
  );
  const retainedToolResults = previousTurn.filter(
    (message) =>
      message.role === CHAT_ROLE.TOOL &&
      currentToolCallIds.has(message.toolCallId) &&
      !currentToolResultIds.has(message.toolCallId)
  );

  if (retainedToolResults.length) reconciled = [...reconciled, ...retainedToolResults];

  return mergeMissingCardCalls(reconciled, previousTurn, currentToolCallIds);
};
