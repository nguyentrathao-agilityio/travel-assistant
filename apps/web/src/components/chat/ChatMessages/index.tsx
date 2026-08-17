import { useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { Bot } from 'lucide-react';

// Components
import { ChatEmptyState } from '../ChatEmptyState';
import { ChatHistoryLoading } from '../ChatHistoryLoading';
import { TypingIndicator } from '../TypingIndicator';
import { Button } from '@/components';

// Hooks
import { useInterruptElement, useScrollToBottom } from '@/hooks';
import type { ConversationChatMessage } from '@/hooks';

// Constants
import { CHAT_ROLE, SECONDARY_SUGGESTIONS, TOOL_SUGGESTION_ITEMS } from '@/constants';

// Stores
import { useSuggestionStore } from '@/stores';
import type { SendMessage } from '@/stores';

// Utils
import { cn, isRealConversationMessage, stableMessageKey } from '@/utils';

const SUGGESTION_SKELETON_WIDTHS = ['w-28', 'w-24', 'w-32'];

interface ChatMessagesProps extends MessagesProps {
  sendMessage: SendMessage | null;
  isHistoryLoading?: boolean;
}

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

const InterruptMessage = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-3 py-2">
    <div className="bg-assistant-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
      <Bot size={18} aria-hidden="true" />
    </div>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

/**
 * Skeleton preview of the suggestion chips row, shown while the turn is still
 * in progress after real assistant text has already appeared.
 */
const PendingSuggestions = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading suggestions"
    className="flex flex-wrap gap-2 pl-[52px]"
  >
    {SUGGESTION_SKELETON_WIDTHS.map((width, index) => (
      <div
        key={index}
        aria-hidden="true"
        className={cn('bg-border-tertiary rounded-pill h-7 animate-pulse', width)}
      />
    ))}
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
  sendMessage,
  isHistoryLoading = false,
  RenderMessage,
  ...restProps
}: ChatMessagesProps) => {
  const lastUserMessageIndex = messages.reduce(
    (latestIndex, message, index) => (message.role === CHAT_ROLE.USER ? index : latestIndex),
    -1
  );
  const currentTurnHasAssistantText =
    lastUserMessageIndex !== -1 &&
    messages.slice(lastUserMessageIndex + 1).some((message) => {
      const candidate = message as ConversationChatMessage;

      return candidate.role === CHAT_ROLE.ASSISTANT && !!candidate.content;
    });

  const { scrollContainerRef } = useScrollToBottom(messages.length);
  const interrupt = useInterruptElement();
  const isTurnPending =
    inProgress && !interrupt && (lastUserMessageIndex === -1 || !currentTurnHasAssistantText);
  const areSuggestionsPending = inProgress && !interrupt && currentTurnHasAssistantText;
  const hasRealMessages = messages.some(isRealConversationMessage);
  const lastTool = useSuggestionStore((s) => s.lastTool);
  const activeSuggestions =
    (lastTool ? TOOL_SUGGESTION_ITEMS[lastTool] : undefined) ?? SECONDARY_SUGGESTIONS;

  const handleSuggestionClick = useCallback(
    (text: string) => {
      void sendMessage?.(text);
    },
    [sendMessage]
  );

  return (
    <div
      ref={scrollContainerRef}
      className="conversation-typography scrollbar-thin bg-background-page flex-1 overflow-y-scroll px-4 py-4"
    >
      {isHistoryLoading && !hasRealMessages ? (
        <ChatHistoryLoading />
      ) : !hasRealMessages && !inProgress ? (
        <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
      ) : (
        <>
          <div className="flex flex-col">
            {messages.map((message, index) => (
              <RenderMessage
                key={stableMessageKey(message, index)}
                message={message}
                messages={messages}
                inProgress={inProgress}
                index={index}
                isCurrentMessage={index === messages.length - 1}
                {...restProps}
              />
            ))}
            {isTurnPending && <PendingAssistantMessage />}
            {interrupt && <InterruptMessage>{interrupt}</InterruptMessage>}
          </div>
          {children}
          {areSuggestionsPending && <PendingSuggestions />}
          {!inProgress && !interrupt && (
            <div className="flex flex-wrap gap-2 pl-[52px]">
              {activeSuggestions.map((s) => {
                const Icon = s.icon;

                return (
                  <Button
                    key={s.message}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestionClick(s.message)}
                    className="conversation-action-suggestion text-badge-primary-text font-regular inline-flex items-center gap-1.5 border px-2.5 py-1 shadow"
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
