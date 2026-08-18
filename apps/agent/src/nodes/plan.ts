import type { RunnableConfig } from '@langchain/core/runnables';

// Utils
import { createSpecializedAgent } from '@/utils';
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';
import type { GraphStateType } from '@/state';

import { AGENT_CONFIGS } from '@/constants/agent-config';

export const PLANNING_AGENT_TOOLS = AGENT_CONFIGS.plan.tools;

export const createPlanningAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.plan, apiKey);

export const planningAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () => createPlanningAgent(apiKey).invoke(state, config));
};
