import { UseAgentUpdate, useAgent, useCopilotKit } from '@copilotkit/react-native/headless';
import { useCallback, useEffect, useRef, useState } from 'react';

// Services
import { generateThreadId } from '../services';

// Constants
import { AGENT_NAME } from '@repo/constants';
import { STOP_GENERATION_RETRY_DELAY_MS } from '../constants';

// Types
import type { Message } from '@copilotkit/react-native/headless';

interface UseChatAgentResult {
  messages: Message[];
  isRunning: boolean;
  isReady: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  resurfaceInterrupt: () => Promise<void>;
  stop: () => void;
}

export const useChatAgent = (threadId: string): UseChatAgentResult => {
  const { agent, isReady } = useAgent({
    agentId: AGENT_NAME,
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  const { copilotkit } = useCopilotKit();
  const [error, setError] = useState<string | null>(null);
  const isRunningRef = useRef(agent.isRunning);
  const stopRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  isRunningRef.current = agent.isRunning;

  useEffect(() => {
    agent.threadId = threadId;
  }, [agent, threadId]);

  useEffect(() => () => clearTimeout(stopRetryTimeoutRef.current), []);

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onError: (event) => {
        if (event.context?.agentId && event.context.agentId !== AGENT_NAME) return;

        setError(event.error.message);
      },
    });

    return () => subscription.unsubscribe();
  }, [copilotkit]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();

      if (!trimmed || isRunningRef.current) return;

      setError(null);
      agent.addMessage({ id: generateThreadId(), role: 'user', content: trimmed });

      try {
        await copilotkit.runAgent({ agent });
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : 'Something went wrong. Please try again.'
        );
      }
    },
    [agent, copilotkit]
  );

  const resurfaceInterrupt = useCallback(async () => {
    if (isRunningRef.current) return;

    try {
      await copilotkit.runAgent({ agent });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Something went wrong. Please try again.'
      );
    }
  }, [agent, copilotkit]);

  // Retries once — the client can silently drop the cancel request otherwise.
  const stop = useCallback(() => {
    agent.abortRun();
    clearTimeout(stopRetryTimeoutRef.current);
    stopRetryTimeoutRef.current = setTimeout(() => {
      if (isRunningRef.current) agent.abortRun();
    }, STOP_GENERATION_RETRY_DELAY_MS);
  }, [agent]);

  return {
    messages: agent.messages,
    isRunning: agent.isRunning,
    isReady,
    error,
    resurfaceInterrupt,
    sendMessage,
    stop,
  };
};
