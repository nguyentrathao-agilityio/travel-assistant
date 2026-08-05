import { createAgent, dynamicSystemPromptMiddleware } from 'langchain';
import { createCopilotkitMiddleware } from '@copilotkit/sdk-js/langgraph';

// Constants
import { OPENAI_API_KEY } from '@/constants';

// Services
import { searchMemories } from '@/services/memory';

// Infrastructure
import { memoryStore } from '@/infrastructure/persistence';
import { createChatModel } from '@/infrastructure/llm';

// Prompts
import { buildAgentSystemPrompt } from '@/prompts';

// Agents
import type { SpecializedAgentConfig } from '@/agents/config';

// State
import { GraphState, type GraphStateType } from '@/state';

// Utils
import { richUiModelMiddleware } from './rich-ui-middleware';
import { createDomainStateMiddleware } from './domain-state-middleware';

const model = createChatModel({ apiKey: OPENAI_API_KEY! });

/** Builds a specialized agent with shared middleware and a dynamic system prompt. */
export const createSpecializedAgent = (config: SpecializedAgentConfig) =>
  createAgent({
    model,
    tools: config.tools,
    stateSchema: GraphState,
    middleware: [
      createCopilotkitMiddleware({ exposeState: false }),
      richUiModelMiddleware,
      createDomainStateMiddleware(config.name),
      dynamicSystemPromptMiddleware(async (state) => {
        const memories = config.prompt.includeMemoryContext
          ? await searchMemories(memoryStore)
          : [];
        return buildAgentSystemPrompt(state as unknown as GraphStateType, config.prompt, memories);
      }),
    ],
  }).graph;
