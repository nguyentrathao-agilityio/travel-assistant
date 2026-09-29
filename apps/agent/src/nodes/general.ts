import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';

// Infrastructure
import { createSpecializedAgent, withSpecializedAgentConfig } from '@/agent/create-agent';
import { openAiApiKeyFromConfig, withOpenAiApiKey } from '@/infrastructure/llm';
import { withLangfuseTracing } from '@/infrastructure/observability';

// State
import type { GraphStateType } from '@/state';

export const createGeneralAgent = (apiKey: string) =>
  createSpecializedAgent(AGENT_CONFIGS.general, apiKey);

export const generalAgent = (state: GraphStateType, config?: RunnableConfig) => {
  const apiKey = openAiApiKeyFromConfig(config);

  return withOpenAiApiKey(apiKey, () =>
    withLangfuseTracing(config, 'general-agent', (tracedConfig) =>
      createGeneralAgent(apiKey).invoke(state, withSpecializedAgentConfig(tracedConfig))
    )
  );
};
