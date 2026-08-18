import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';

// Infrastructure
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';

// State
import type { GraphStateType } from '@/state';

// Utils
import { createSpecializedAgent } from '@/utils';

export const EXPLORE_AGENT_TOOLS = AGENT_CONFIGS.explore.tools;

export const createExploreAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.explore, apiKey);

export const exploreAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () => createExploreAgent(apiKey).invoke(state, config));
};
