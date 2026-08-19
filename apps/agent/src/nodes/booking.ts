import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';

// Infrastructure
import { createSpecializedAgent } from '@/infrastructure/agent';
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';

// State
import type { GraphStateType } from '@/state';

export const createBookingAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.booking, apiKey);

export const bookingAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () => createBookingAgent(apiKey).invoke(state, config));
};
