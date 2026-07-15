import { useCopilotChatInternal } from '@copilotkit/react-core';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Lib
import { mastraClient } from '@/lib';

// Constants
import { AGENT_NAME } from '@/constants';

// Schemas
import { ThreadMessagesResponseSchema } from '@repo/schemas';

// Utils
import { toAgUiMessages, deduplicateHitlResends } from '@/utils';

/**
 * Fetches history for a resumed thread and injects it into CopilotKit's message state.
 * No-ops when `isResumed` is false (new thread) or `threadId` was already injected.
 */
export const useInjectThreadHistory = (
  threadId: string,
  isResumed: boolean
): { isLoading: boolean; error: Error | null } => {
  const { setMessages } = useCopilotChatInternal();

  const lastInjectedThreadIdRef = useRef<string | null>(null);
  const setMessagesRef = useRef(setMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useLayoutEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);

  useEffect(() => {
    if (!isResumed) return;
    if (!threadId) return;
    if (lastInjectedThreadIdRef.current === threadId) return;

    lastInjectedThreadIdRef.current = threadId;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setMessagesRef.current([]);

    mastraClient
      .listThreadMessages(threadId, { agentId: AGENT_NAME })
      .then((result) => {
        if (cancelled) return;

        const parsed = ThreadMessagesResponseSchema.safeParse(result);
        if (!parsed.success) throw new Error('Unexpected response shape from listThreadMessages');

        const dedupedRaw = deduplicateHitlResends(parsed.data.messages);
        const agUiMessages = dedupedRaw.flatMap(toAgUiMessages);

        if (!agUiMessages.length) return;

        setMessagesRef.current(agUiMessages);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        lastInjectedThreadIdRef.current = null;

        // Thread exists locally but not yet on the backend — no history to load.
        if (err.message?.toLowerCase().includes('thread not found')) return;

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
  }, [threadId, isResumed]);

  return { isLoading, error };
};
