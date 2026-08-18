import type { RunnableConfig } from '@langchain/core/runnables';

// Utils
import { createSpecializedAgent } from '@/utils';
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';
import type { GraphStateType } from '@/state';

import { AGENT_CONFIGS } from '@/constants/agent-config';

export const GENERAL_AGENT_TOOLS = AGENT_CONFIGS.general.tools;

export const createGeneralAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.general, apiKey);

export const generalAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () => createGeneralAgent(apiKey).invoke(state, config));
};
