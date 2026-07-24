import type { MessagesProps } from '@copilotkit/react-ui';
import { useShallow } from 'zustand/shallow';

import { useConversationMessages } from '@/hooks';
import { useConversationRendererStore, useThreadStore } from '@/stores';

import { ChatMessages } from '../ChatMessages';

/**
 * A module-scoped renderer gives CopilotChat a stable component identity while
 * Zustand supplies the active thread snapshot without changing that identity.
 */
export const ConversationMessages = (props: MessagesProps) => {
  const activeThreadId = useThreadStore((state) => state.activeThreadId);
  const { historyThreadId, persistedMessages, isHistoryLoading, sendMessage } =
    useConversationRendererStore(
      useShallow((state) => ({
        historyThreadId: state.threadId,
        persistedMessages: state.persistedMessages,
        isHistoryLoading: state.isHistoryLoading,
        sendMessage: state.sendMessage,
      }))
    );
  const isCurrentThread = historyThreadId === activeThreadId;
  const messages = useConversationMessages(persistedMessages, props.messages);

  return (
    <ChatMessages
      {...props}
      messages={isCurrentThread ? messages : props.messages}
      sendMessage={sendMessage}
      isHistoryLoading={isCurrentThread ? isHistoryLoading : true}
    />
  );
};
