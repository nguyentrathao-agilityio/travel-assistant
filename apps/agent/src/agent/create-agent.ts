import { createAgent } from 'langchain';
import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import type { SpecializedAgentConfig } from '@/constants/agent-config';
import { FALLBACK_MODEL, SPECIALIZED_AGENT_RECURSION_LIMIT } from '@/constants';

// Infrastructure
import { createChatModel } from '@/infrastructure/llm';
import { createAgentMiddleware } from './middleware';

// State
import { GraphState } from '@/state';

/** Preserves request-scoped tracing/thread config while reserving enough steps for inner agents. */
export const withSpecializedAgentConfig = (config?: RunnableConfig): RunnableConfig => ({
  ...config,
  recursionLimit: SPECIALIZED_AGENT_RECURSION_LIMIT,
});

/** Builds a specialized agent with shared middleware and a dynamic system prompt. */
export const createSpecializedAgent = (config: SpecializedAgentConfig, apiKey: string) => {
  const model = createChatModel({ apiKey });
  const fallbackModel = createChatModel({ apiKey, model: FALLBACK_MODEL });

  return createAgent({
    model,
    tools: config.tools,
    stateSchema: GraphState,
    checkpointer: config.approvalTools?.length ? true : undefined,
    middleware: createAgentMiddleware({ config, model, fallbackModel }),
  }).graph;
};
