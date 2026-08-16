import type { MessagesProps } from '@copilotkit/react-ui';
import { useShallow } from 'zustand/shallow';

import { useConversationMessages } from '@/hooks';
import { useConversationRendererStore, useThreadStore } from '@/stores';
import { isCurrentThread } from '@/utils';

import { ChatMessages } from '../ChatMessages';

/**
 * A module-scoped renderer gives CopilotChat a stable component identity while
 * Zustand supplies the active thread snapshot without changing that identity.
 */
export const ConversationMessages = (props: MessagesProps) => {
  const activeThreadId = useThreadStore((state) => state.activeThreadId);
  const { historyThreadId, isHistoryLoading, sendMessage } = useConversationRendererStore(
    useShallow((state) => ({
      historyThreadId: state.threadId,
      isHistoryLoading: state.isHistoryLoading,
      sendMessage: state.sendMessage,
    }))
  );
  const isThreadCurrent = isCurrentThread(historyThreadId, activeThreadId);
  const messages = useConversationMessages(props.messages, activeThreadId, props.inProgress);

  return (
    <ChatMessages
      {...props}
      messages={isThreadCurrent ? messages : props.messages}
      sendMessage={sendMessage}
      isHistoryLoading={isThreadCurrent ? isHistoryLoading : true}
    />
  );
};
