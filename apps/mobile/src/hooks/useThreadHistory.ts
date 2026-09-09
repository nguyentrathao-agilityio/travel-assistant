import { useEffect, useState } from 'react';

// Services
import { fetchThreadValues } from '../services/threadHistory';

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
  const [state, setState] = useState<ThreadHistoryResult>({
    messages: EMPTY_MESSAGES,
    isLoading: Boolean(threadId),
  });

  useEffect(() => {
    if (!threadId) {
      setState({ messages: EMPTY_MESSAGES, isLoading: false });

      return;
    }

    let isCurrentRequest = true;

    setState({ messages: EMPTY_MESSAGES, isLoading: true });

    fetchThreadValues(threadId)
      .then((values) => {
        if (!isCurrentRequest) return;

        const rawMessages = ((values as LangGraphThreadValues | undefined)?.messages ??
          []) as LangGraphRawMessage[];
        const messages = rawMessages.flatMap((message, index) => {
          const converted = toAgUiMessage(message, `${threadId}:${index}`);

          return converted ? [converted] : [];
        });

        setState({ messages, isLoading: false });
      })
      .catch(() => {
        if (!isCurrentRequest) return;

        // A missing/unreachable thread just means an empty conversation — the chat
        // screen surfaces the failure itself once it actually needs the thread.
        setState({ messages: EMPTY_MESSAGES, isLoading: false });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [threadId]);

  return state;
};
