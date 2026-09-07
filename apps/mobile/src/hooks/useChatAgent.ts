import { UseAgentUpdate, useAgent, useCopilotKit } from '@copilotkit/react-native/headless';
import { AGENT_NAME } from '@repo/constants';
import { useCallback, useEffect, useState } from 'react';

import { generateThreadId } from '../services';

import type { Message } from '@copilotkit/react-native/headless';

interface UseChatAgentResult {
  messages: Message[];
  isRunning: boolean;
  isReady: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  stop: () => void;
}

/**
 * Binds this screen's chat to the shared `travelAgent` agent, pinned to
 * `threadId`. Mirrors @copilotkit/react-native's own `<CopilotChat>` headless
 * component: a single shared agent instance (`useAgent({ agentId })`) whose
 * `.threadId` is mutated in an effect, rather than registering a distinct
 * proxied agent per thread — the latter is for running several threads
 * *simultaneously* (e.g. a multi-thread drawer), not a single active screen.
 */
export const useChatAgent = (threadId: string): UseChatAgentResult => {
  const { agent, isReady } = useAgent({
    agentId: AGENT_NAME,
    updates: [UseAgentUpdate.OnMessagesChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  const { copilotkit } = useCopilotKit();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    agent.threadId = threadId;
  }, [agent, threadId]);

  // `copilotkit.runAgent()` resolves normally even when the run fails
  // mid-stream (a RUN_ERROR event, e.g. a missing OpenAI key) — it only
  // rejects for request-level failures (network down, bad URL). Mid-run
  // errors surface exclusively through this core-level subscription, which
  // is how @copilotkit/react-native's own <CopilotChat> reports them too.
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

      if (!trimmed) return;

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

  const stop = useCallback(() => {
    agent.abortRun();
  }, [agent]);

  return {
    messages: agent.messages,
    isRunning: agent.isRunning,
    isReady,
    error,
    sendMessage,
    stop,
  };
};
