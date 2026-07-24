import { CustomAssistantMessage } from '@/components/chat/CustomAssistantMessage';
import { CustomUserMessage } from '@/components/chat/CustomUserMessage';
import type { InputProps } from '@copilotkit/react-ui';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { useEffect, useLayoutEffect } from 'react';
import { useShallow } from 'zustand/shallow';

// Stores
import { useConversationRendererStore, useThreadStore } from '@/stores';

// Hooks
import {
  useBookedActions,
  useBookingAction,
  useBookingInfo,
  useDestinationExplorerAction,
  useFlightAction,
  useThemeAction,
  useHotelAction,
  useThreadHistory,
  useLocalTipsAction,
  usePlacesAction,
  useRouteAction,
  useTitleSync,
  useTripSummaryAction,
  useWeatherAction,
} from '@/hooks';

// Components
import { BookingPanel } from './BookingPanel';
import { ChatInputBar } from './ChatInputBar';
import { ConversationMessages } from './ConversationMessages';
import { ThemeToggle } from '../ThemeToggle';

const ConversationInput = (props: InputProps) => {
  const setSendMessage = useConversationRendererStore((state) => state.setSendMessage);

  useEffect(() => {
    setSendMessage(props.onSend);
    return () => setSendMessage(null);
  }, [props.onSend, setSendMessage]);

  return <ChatInputBar {...props} />;
};

export const TravelChat = () => {
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
  const setThreadHistory = useConversationRendererStore((state) => state.setThreadHistory);

  useLayoutEffect(() => {
    setThreadHistory(activeThreadId, persistedMessages, isHistoryLoading);
  }, [activeThreadId, persistedMessages, isHistoryLoading, setThreadHistory]);

  useBookingInfo();
  useBookingAction();
  useFlightAction();
  useHotelAction();
  useWeatherAction();
  usePlacesAction();
  useRouteAction();
  useLocalTipsAction();
  useTripSummaryAction();
  useDestinationExplorerAction();
  useTitleSync();
  useBookedActions();
  useThemeAction();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="z-50 flex h-14 shrink-0 items-center justify-between border-b px-5 shadow">
        <div className="flex items-center gap-1">
          <h1 className="text-body text-text-primary font-medium leading-none">{threadTitle}</h1>
        </div>
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </header>
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
