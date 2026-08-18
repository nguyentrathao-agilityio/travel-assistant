import type { RunnableConfig } from '@langchain/core/runnables';

// Utils
import { createSpecializedAgent } from '@/utils';
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';
import type { GraphStateType } from '@/state';

import { AGENT_CONFIGS } from '@/constants/agent-config';

export const EXPLORE_AGENT_TOOLS = AGENT_CONFIGS.explore.tools;

export const createExploreAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.explore, apiKey);

export const exploreAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () => createExploreAgent(apiKey).invoke(state, config));
};
