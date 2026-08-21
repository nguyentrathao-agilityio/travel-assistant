import { createAgent } from 'langchain';

// Constants
import type { SpecializedAgentConfig } from '@/constants/agent-config';

// Infrastructure
import { createChatModel } from '@/infrastructure/llm';
import { createAgentMiddleware } from './middleware';

// State
import { GraphState } from '@/state';

/** Builds a specialized agent with shared middleware and a dynamic system prompt. */
export const createSpecializedAgent = (config: SpecializedAgentConfig, apiKey: string) => {
  const model = createChatModel({ apiKey });

  return createAgent({
    model,
    tools: config.tools,
    stateSchema: GraphState,
    checkpointer: config.approvalTools?.length ? true : undefined,
    middleware: createAgentMiddleware({ config, model }),
  }).graph;
};
