import { useCallback, useMemo } from 'react';
import { type RefObject } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { useCopilotChatInternal } from '@copilotkit/react-core';
import { Bot } from 'lucide-react';
import { ChatEmptyState } from '../ChatEmptyState';
import { ChatHistoryLoading } from '../ChatHistoryLoading';
import { TypingIndicator } from '../TypingIndicator';
import { useScrollToBottom } from '@/hooks';
import {
  COAGENT_STATE_RENDER_MESSAGE_NAME,
  SECONDARY_SUGGESTIONS,
  TOOL_NAMES,
  TOOL_SUGGESTION_ITEMS,
} from '@/constants';
import { Button } from '@/components';
import { useSuggestionStore } from '@/stores';

interface ChatMessagesProps extends MessagesProps {
  sendRef: RefObject<((text: string) => Promise<unknown>) | null>;
  isHistoryLoading?: boolean;
}

const BOOKING_TOOL_NAMES = new Set<string>([
  TOOL_NAMES.BOOK_FLIGHT,
  TOOL_NAMES.BOOK_HOTEL,
  TOOL_NAMES.CANCEL_BOOKING,
]);

type ChatMessage = MessagesProps['messages'][number];

const createToolCallSignature = (toolName: string, toolArguments: string): string =>
  `${toolName}:${toolArguments}`;

const normalizeMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const seenMessageIds = new Set<string>();
  const seenToolCallIds = new Set<string>();
  const seenBookingToolCalls = new Set<string>();

  return [...messages]
    .reverse()
    .filter((message) => {
      if (!message.id) return true;
      if (seenMessageIds.has(message.id)) return false;

      seenMessageIds.add(message.id);
      return true;
    })
    .map((message) => {
      if (message.role === 'user') {
        seenBookingToolCalls.clear();
        return message;
      }

      if (message.role !== 'assistant' || !message.toolCalls?.length) return message;

      const toolCalls = message.toolCalls.filter((toolCall) => {
        if (seenToolCallIds.has(toolCall.id)) return false;

        seenToolCallIds.add(toolCall.id);

        const { name: toolName, arguments: toolArguments } = toolCall.function;
        if (!BOOKING_TOOL_NAMES.has(toolName)) return true;

        const signature = createToolCallSignature(toolName, toolArguments);
        if (seenBookingToolCalls.has(signature)) return false;

        seenBookingToolCalls.add(signature);
        return true;
      });

      return { ...message, toolCalls };
    })
    .filter(
      (message) =>
        message.role !== 'assistant' ||
        Boolean(message.content) ||
        Boolean(message.toolCalls?.length)
    )
    .reverse();
};

const PendingAssistantMessage = () => (
  <div className="flex max-w-[80%] gap-3 py-2">
    <div className="bg-assistant-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
      <Bot size={18} aria-hidden="true" />
    </div>
    <div className="bg-background-secondary text-text-primary rounded-[28px] px-4 py-2 shadow">
      <TypingIndicator className="p-0" />
    </div>
  </div>
);

/**
 * Custom messages area for CopilotKit's `Messages` prop.
 * Shows the empty state when there are no messages, otherwise renders the message list.
 */
const ChatMessages = ({
  messages,
  inProgress,
  children,
  sendRef,
  isHistoryLoading = false,
  RenderMessage,
  ...restProps
}: ChatMessagesProps) => {
  const displayMessages = useMemo(() => normalizeMessages(messages), [messages]);
  const latestConversationMessage = [...displayMessages]
    .reverse()
    .find((message) => !('name' in message) || message.name !== COAGENT_STATE_RENDER_MESSAGE_NAME);
  const showPendingAssistant =
    inProgress && (!latestConversationMessage || latestConversationMessage.role === 'user');

  const { scrollContainerRef } = useScrollToBottom(displayMessages.length);
  const { interrupt } = useCopilotChatInternal();
  const hasRealMessages = displayMessages.some(
    (message) => !('name' in message) || message.name !== COAGENT_STATE_RENDER_MESSAGE_NAME
  );
  const lastTool = useSuggestionStore((s) => s.lastTool);
  const activeSuggestions =
    (lastTool ? TOOL_SUGGESTION_ITEMS[lastTool] : undefined) ?? SECONDARY_SUGGESTIONS;

  const handleSuggestionClick = useCallback(
    (text: string) => {
      sendRef.current?.(text);
    },
    [sendRef]
  );

  return (
    <div
      ref={scrollContainerRef}
      className="scrollbar-thin bg-background-page flex-1 overflow-y-scroll px-4 py-4"
    >
      {isHistoryLoading ? (
        <ChatHistoryLoading />
      ) : !hasRealMessages && !inProgress ? (
        <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
      ) : (
        <>
          <div className="flex flex-col">
            {displayMessages.map((message, index) => (
              <RenderMessage
                key={message.id ?? index}
                message={message}
                messages={displayMessages}
                inProgress={inProgress}
                index={index}
                isCurrentMessage={index === displayMessages.length - 1}
                {...restProps}
              />
            ))}
            {showPendingAssistant && <PendingAssistantMessage />}
            {interrupt}
          </div>
          {children}
          {!inProgress && (
            <div className="flex flex-wrap gap-2 pl-[52px]">
              {activeSuggestions.map((s) => {
                const Icon = s.icon;

                return (
                  <Button
                    key={s.message}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestionClick(s.message)}
                    className="text-badge-primary-text font-regular inline-flex items-center gap-1.5 border px-2.5 py-1 shadow"
                  >
                    <Icon size={13} aria-hidden="true" />
                    {s.title}
                  </Button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export { ChatMessages };
