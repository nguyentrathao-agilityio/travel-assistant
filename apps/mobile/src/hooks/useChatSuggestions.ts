import { useConfigureSuggestions, useSuggestions } from '@copilotkit/react-native/headless';
import { useEffect, useRef } from 'react';

// Constants
import { AGENT_NAME } from '@repo/constants';
import { MAX_VISIBLE_SUGGESTIONS } from '../constants';

// Types
import type { Suggestion } from '@copilotkit/react-native/headless';

interface UseChatSuggestionsParams {
  threadId: string;
  historyMessageCount: number;
  liveMessageCount: number;
  isRunning: boolean;
  isAwaitingApproval: boolean;
}

interface UseChatSuggestionsResult {
  suggestions: Suggestion[];
  isLoading: boolean;
}

const SUGGESTION_INSTRUCTIONS = `Suggest at most ${MAX_VISIBLE_SUGGESTIONS} short, natural next actions for
  the user's trip planning, based on what the assistant just did in this conversation and the
  current trip state. For example: after showing flights, suggest hotels or weather; after a hotel,
  suggest local tips or nearby places; after a full itinerary, suggest local tips. Keep each
  suggestion under 6 words.`;

export const useChatSuggestions = ({
  threadId,
  historyMessageCount,
  liveMessageCount,
  isRunning,
  isAwaitingApproval,
}: UseChatSuggestionsParams): UseChatSuggestionsResult => {
  const reloadedThreadRef = useRef<string | null>(null);

  useConfigureSuggestions({
    instructions: SUGGESTION_INSTRUCTIONS,
    minSuggestions: 1,
    maxSuggestions: MAX_VISIBLE_SUGGESTIONS,
    available: 'after-first-message',
    providerAgentId: AGENT_NAME,
    consumerAgentId: AGENT_NAME,
  });

  const { suggestions, isLoading, reloadSuggestions } = useSuggestions({ agentId: AGENT_NAME });

  useEffect(() => {
    if (reloadedThreadRef.current === threadId) return;
    if (historyMessageCount === 0 || liveMessageCount === 0) return;
    if (isRunning || isAwaitingApproval) return;

    reloadedThreadRef.current = threadId;
    reloadSuggestions();
  }, [
    threadId,
    historyMessageCount,
    liveMessageCount,
    isRunning,
    isAwaitingApproval,
    reloadSuggestions,
  ]);

  return { suggestions: suggestions.slice(0, MAX_VISIBLE_SUGGESTIONS), isLoading };
};
