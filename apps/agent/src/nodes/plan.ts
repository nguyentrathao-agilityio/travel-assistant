import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';

// Infrastructure
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';

// State
import type { GraphStateType } from '@/state';

// Utils
import { createSpecializedAgent } from '@/utils';

export const PLANNING_AGENT_TOOLS = AGENT_CONFIGS.plan.tools;

export const createPlanningAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.plan, apiKey);

export const planningAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () => createPlanningAgent(apiKey).invoke(state, config));
};
