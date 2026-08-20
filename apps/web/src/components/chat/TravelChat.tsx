import { CustomAssistantMessage } from '@/components/chat/CustomAssistantMessage';
import { CustomUserMessage } from '@/components/chat/CustomUserMessage';
import type { InputProps } from '@copilotkit/react-ui';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useState } from 'react';
import { History } from 'lucide-react';
import { useShallow } from 'zustand/shallow';

// Stores
import { useConversationRendererStore, useThreadStore } from '@/stores';

// Hooks
import { useThreadHistory, useSeedAgentHistory, useTravelCopilot } from '@/hooks';

// Components
import { BookingPanel } from './BookingPanel';
import { ChatInputBar } from './ChatInputBar';
import { ConversationMessages } from './ConversationMessages';
import { ThemeToggle } from '../ThemeToggle';
import { TimeTravelPanel } from './TimeTravelPanel';
import { Button } from '../common';

const ConversationInput = (props: InputProps) => {
  const setSendMessage = useConversationRendererStore((state) => state.setSendMessage);
  const onSendRef = useRef(props.onSend);

  onSendRef.current = props.onSend;

  const sendMessage = useCallback((text: string) => onSendRef.current(text), []);

  useEffect(() => {
    setSendMessage(sendMessage);

    return () => setSendMessage(null);
  }, [sendMessage, setSendMessage]);

  return <ChatInputBar {...props} />;
};

export const TravelChat = () => {
  const [isTimeTravelOpen, setIsTimeTravelOpen] = useState(false);
  const { activeThreadId, threads } = useThreadStore(
    useShallow((state) => ({
      activeThreadId: state.activeThreadId,
      threads: state.threads,
    }))
  );

  const activeThread = threads.find((thread) => thread.id === activeThreadId);
  const threadTitle = activeThread?.title ?? 'Travel Assistant';

  const { messages: persistedMessages, isLoading: isHistoryLoading } =
    useThreadHistory(activeThreadId);
  const setHistoryStatus = useConversationRendererStore((state) => state.setHistoryStatus);

  useSeedAgentHistory(activeThreadId, persistedMessages, isHistoryLoading);

  useLayoutEffect(() => {
    setHistoryStatus(activeThreadId, isHistoryLoading);
  }, [activeThreadId, isHistoryLoading, setHistoryStatus]);

  useTravelCopilot();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="z-50 flex h-14 shrink-0 items-center justify-between border-b px-5 shadow">
        <div className="flex items-center gap-1">
          <h1 className="text-body text-text-primary font-medium leading-none">{threadTitle}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Open workflow history"
            title="Workflow history"
            onClick={() => setIsTimeTravelOpen((open) => !open)}
          >
            <History size={17} />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <TimeTravelPanel open={isTimeTravelOpen} onClose={() => setIsTimeTravelOpen(false)} />
      <BookingPanel />
      <CopilotChat
        className="flex flex-1 flex-col overflow-hidden"
        Messages={ConversationMessages}
        Input={ConversationInput}
        AssistantMessage={CustomAssistantMessage}
        UserMessage={CustomUserMessage}
      />
    </div>
  );
};
