import { useConfigureSuggestions, useSuggestions } from '@copilotkit/react-native/headless';

// Constants
import { AGENT_NAME } from '@repo/constants';
import { MAX_VISIBLE_SUGGESTIONS } from '../constants';

// Types
import type { Suggestion } from '@copilotkit/react-native/headless';

interface UseChatSuggestionsResult {
  suggestions: Suggestion[];
  isLoading: boolean;
}

const SUGGESTION_INSTRUCTIONS = `Suggest at most ${MAX_VISIBLE_SUGGESTIONS} short, natural next actions for
  the user's trip planning, based on what the assistant just did in this conversation and the
  current trip state. For example: after showing flights, suggest hotels or weather; after a hotel,
  suggest local tips or nearby places; after a full itinerary, suggest local tips. Keep each
  suggestion under 6 words.`;

/**
 * Suggestions come from CopilotKit's LLM engine — never a hardcoded list. The config is constant:
 * CopilotKit reloads suggestions once when each agent run ends and seeds that run with the agent's
 * messages and trip state, while any config change (e.g. trip state embedded in the instructions)
 * would start extra suggestion runs mid-run. The chat UI hides chips while running or awaiting approval.
 */
export const useChatSuggestions = (): UseChatSuggestionsResult => {
  useConfigureSuggestions({
    instructions: SUGGESTION_INSTRUCTIONS,
    minSuggestions: 1,
    maxSuggestions: MAX_VISIBLE_SUGGESTIONS,
    available: 'after-first-message',
    providerAgentId: AGENT_NAME,
    consumerAgentId: AGENT_NAME,
  });

  const { suggestions, isLoading } = useSuggestions({ agentId: AGENT_NAME });

  return { suggestions: suggestions.slice(0, MAX_VISIBLE_SUGGESTIONS), isLoading };
};
