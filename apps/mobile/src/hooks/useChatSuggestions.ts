import { useConfigureSuggestions, useSuggestions } from '@copilotkit/react-native/headless';

// Constants
import { AGENT_NAME } from '@repo/constants';
import { MAX_VISIBLE_SUGGESTIONS } from '../constants';

// Types
import type { Suggestion } from '@copilotkit/react-native/headless';
import type { TripState } from '@repo/types';

interface UseChatSuggestionsParams {
  state: TripState;
  isAwaitingApproval: boolean;
  isRunning: boolean;
  messageCount: number;
}

interface UseChatSuggestionsResult {
  suggestions: Suggestion[];
  isLoading: boolean;
}

const tripStateSummary = (state: TripState): string => {
  const facts: string[] = [];

  if (state.destination) facts.push(`destination is ${state.destination}`);
  if (state.flights?.departure) facts.push('a flight is already selected');
  if (state.hotel) facts.push('a hotel is already selected');

  return facts.length ? facts.join('; ') : 'no trip details confirmed yet';
};

// Suggestions come from CopilotKit's LLM engine, grounded in trip state — never a hardcoded list.
export const useChatSuggestions = ({
  state,
  isAwaitingApproval,
  isRunning,
  messageCount,
}: UseChatSuggestionsParams): UseChatSuggestionsResult => {
  useConfigureSuggestions(
    isAwaitingApproval || isRunning
      ? null
      : {
          instructions: `Suggest at most ${MAX_VISIBLE_SUGGESTIONS} short, natural next actions for
            the user's trip planning, based on what the assistant just did in this conversation and
            the current trip state (${tripStateSummary(state)}). For example: after showing flights,
            suggest hotels or weather; after a hotel, suggest local tips or nearby places; after a
            full itinerary, suggest local tips. Keep each suggestion under 6 words.`,
          minSuggestions: 1,
          maxSuggestions: MAX_VISIBLE_SUGGESTIONS,
          available: 'after-first-message',
          providerAgentId: AGENT_NAME,
          consumerAgentId: AGENT_NAME,
        },
    [state, messageCount, isRunning, isAwaitingApproval]
  );

  const { suggestions, isLoading } = useSuggestions({ agentId: AGENT_NAME });

  return { suggestions: suggestions.slice(0, MAX_VISIBLE_SUGGESTIONS), isLoading };
};
