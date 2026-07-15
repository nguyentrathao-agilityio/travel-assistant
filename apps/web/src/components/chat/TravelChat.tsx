import { CustomAssistantMessage } from '@/components/chat/CustomAssistantMessage';
import { CustomUserMessage } from '@/components/chat/CustomUserMessage';
import type { InputProps, MessagesProps } from '@copilotkit/react-ui';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

// Stores
import { useThreadStore } from '@/stores';

// Hooks
import {
  useBookedActions,
  useBookingInfo,
  useDestinationExplorerAction,
  useFlightAction,
  useThemeAction,
  useHotelAction,
  useInjectThreadHistory,
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
import { ChatMessages } from './ChatMessages';
import { ThemeToggle } from '../ThemeToggle';

export const TravelChat = () => {
  const sendRef = useRef<((text: string) => Promise<unknown>) | null>(null);

  const { activeThreadId, isResumed, threads } = useThreadStore(
    useShallow((state) => ({
      activeThreadId: state.activeThreadId,
      isResumed: state.isResumed,
      threads: state.threads,
    }))
  );

  const activeThread = threads.find((thread) => thread.id === activeThreadId);
  const threadTitle = activeThread?.title ?? 'Travel Assistant';

  const { isLoading: isHistoryLoading } = useInjectThreadHistory(activeThreadId, isResumed);
  const isHistoryLoadingRef = useRef(isHistoryLoading);
  isHistoryLoadingRef.current = isHistoryLoading;

  useBookingInfo();
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

  const CustomInput = useMemo(() => {
    const InputComp = (props: InputProps) => {
      sendRef.current = props.onSend;
      return <ChatInputBar {...props} />;
    };

    return InputComp;
  }, []);

  const CustomMessages = useMemo(() => {
    const MessagesComp = (props: MessagesProps) => (
      <ChatMessages {...props} sendRef={sendRef} isHistoryLoading={isHistoryLoadingRef.current} />
    );

    return MessagesComp;
  }, []);

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
        Messages={CustomMessages}
        Input={CustomInput}
        AssistantMessage={CustomAssistantMessage}
        UserMessage={CustomUserMessage}
      />
    </div>
  );
};
