import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';

// Infrastructure
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';

// State
import type { GraphStateType } from '@/state';

// Utils
import { createSpecializedAgent } from '@/utils';

export const GENERAL_AGENT_TOOLS = AGENT_CONFIGS.general.tools;

export const createGeneralAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.general, apiKey);

export const generalAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () => createGeneralAgent(apiKey).invoke(state, config));
};
