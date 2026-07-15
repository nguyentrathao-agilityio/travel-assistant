import { useCallback } from 'react';
import { type RefObject } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { ChatEmptyState } from '../ChatEmptyState';
import { ChatHistoryLoading } from '../ChatHistoryLoading';
import { useScrollToBottom } from '@/hooks';
import { SECONDARY_SUGGESTIONS, TOOL_SUGGESTION_ITEMS } from '@/constants';
import { Button } from '@/components';
import { useSuggestionStore } from '@/stores';

interface ChatMessagesProps extends MessagesProps {
  sendRef: RefObject<((text: string) => Promise<unknown>) | null>;
  isHistoryLoading?: boolean;
}

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
  const { scrollContainerRef } = useScrollToBottom(messages.length);
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
      ) : !messages?.length && !inProgress ? (
        <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
      ) : (
        <>
          <div className="flex flex-col">
            {messages.map((message, index) => (
              <RenderMessage
                key={message.id ?? index}
                message={message}
                messages={messages}
                inProgress={inProgress}
                index={index}
                isCurrentMessage={index === messages.length - 1}
                {...restProps}
              />
            ))}
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
