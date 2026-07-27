import { useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { useCopilotChatInternal } from '@copilotkit/react-core';
import { Bot } from 'lucide-react';
import { ChatEmptyState } from '../ChatEmptyState';
import { ChatHistoryLoading } from '../ChatHistoryLoading';
import { TypingIndicator } from '../TypingIndicator';
import { useScrollToBottom } from '@/hooks';
import { SECONDARY_SUGGESTIONS, TOOL_SUGGESTION_ITEMS } from '@/constants';
import { Button } from '@/components';
import { useSuggestionStore } from '@/stores';
import type { SendMessage } from '@/stores';
import { isRealConversationMessage } from '@/utils';

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
  const latestConversationMessage = [...messages].reverse().find(isRealConversationMessage);
  // Only show the typing placeholder while waiting on a reply to the user's own message —
  // once the assistant's streamed message appears, its own bubble takes over.
  const showPendingAssistant =
    inProgress && (!latestConversationMessage || latestConversationMessage.role === 'user');

  const { scrollContainerRef } = useScrollToBottom(messages.length);
  const { interrupt } = useCopilotChatInternal();
  // Excludes CopilotKit's synthetic "coagent-state-render" placeholder so a thread with
  // only that entry still shows the empty state instead of the message list.
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
      className="scrollbar-thin bg-background-page flex-1 overflow-y-scroll px-4 py-4"
    >
      {isHistoryLoading ? (
        <ChatHistoryLoading />
      ) : !hasRealMessages && !inProgress ? (
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
            {showPendingAssistant && <PendingAssistantMessage />}
            {interrupt && <InterruptMessage>{interrupt}</InterruptMessage>}
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
