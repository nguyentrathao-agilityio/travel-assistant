import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';

// Utils
import { createSpecializedAgent } from '@/utils';
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';
import type { GraphStateType } from '@/state';

export const BOOKING_AGENT_TOOLS = AGENT_CONFIGS.booking.tools;

export const createBookingAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.booking, apiKey);

export const bookingAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () => createBookingAgent(apiKey).invoke(state, config));
};
