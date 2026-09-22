import { useQuery } from '@tanstack/react-query';

// Services
import { fetchThreadValues } from '../services/threadHistory';

// Hooks
import { threadQueryKeys } from './threadQueryKeys';

// Utils
import { toAgUiMessage } from '../utils/langgraphMessage';

// Types
import type { LangGraphRawMessage, LangGraphThreadValues } from '../utils/langgraphMessage';
import type { Message } from '@copilotkit/react-native/headless';

interface ThreadHistoryResult {
  messages: Message[];
  isLoading: boolean;
}

const EMPTY_MESSAGES: Message[] = [];

export const useThreadHistory = (threadId: string): ThreadHistoryResult => {
  const query = useQuery({
    enabled: Boolean(threadId),
    queryFn: async () => {
      const values = await fetchThreadValues(threadId);
      const rawMessages = ((values as LangGraphThreadValues | undefined)?.messages ??
        []) as LangGraphRawMessage[];

      return rawMessages.flatMap((message, index) => {
        const converted = toAgUiMessage(message, `${threadId}:${index}`);

        return converted ? [converted] : [];
      });
    },
    queryKey: threadQueryKeys.history(threadId),
    retry: false,
  });

  return {
    messages: query.data ?? EMPTY_MESSAGES,
    isLoading: query.isPending && Boolean(threadId),
  };
};
