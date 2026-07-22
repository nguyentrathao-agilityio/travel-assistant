import { useCopilotChatInternal } from '@copilotkit/react-core';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Lib
import { langgraphClient } from '@/lib';

// Utils
import { toAgUiMessage } from '@/utils';

import type { LangGraphRawMessage } from '@/utils';

/**
 * Fetches history for a resumed thread and injects it into CopilotKit's message state.
 * No-ops when `isResumed` is false (new thread) or `threadId` was already injected.
 */
export const useInjectThreadHistory = (
  threadId: string,
  isResumed: boolean
): { isLoading: boolean; error: Error | null } => {
  const { setMessages, isAvailable } = useCopilotChatInternal();

  const lastInjectedThreadIdRef = useRef<string | null>(null);
  const setMessagesRef = useRef(setMessages);
  const [isLoading, setIsLoading] = useState(isResumed);
  const [error, setError] = useState<Error | null>(null);

  useLayoutEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);

  useEffect(() => {
    if (!isResumed) return;
    if (!threadId) return;
    if (!isAvailable) return;

    if (lastInjectedThreadIdRef.current === threadId) return;

    lastInjectedThreadIdRef.current = threadId;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setMessagesRef.current([]);

    langgraphClient.threads
      .getState<{ messages?: LangGraphRawMessage[] }>(threadId)
      .then((state) => {
        if (cancelled) return;

        const rawMessages = state.values?.messages ?? [];
        const agUiMessages = rawMessages.flatMap((message, index) => {
          const converted = toAgUiMessage(message, `${threadId}:${index}`);
          return converted ? [converted] : [];
        });

        if (!agUiMessages.length) return;

        setMessagesRef.current(agUiMessages);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        lastInjectedThreadIdRef.current = null;

        // Thread exists locally but not yet on the backend — no history to load.
        if (err.message.toLowerCase().includes('not found')) return;

        setError(err);
        toast.error('Failed to load chat history. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      lastInjectedThreadIdRef.current = null;
    };
  }, [threadId, isResumed, isAvailable]);

  return { isLoading, error };
};
