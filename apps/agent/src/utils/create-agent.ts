import { createAgent, dynamicSystemPromptMiddleware } from 'langchain';
import { createCopilotkitMiddleware } from '@copilotkit/sdk-js/langgraph';
import type { StructuredToolInterface } from '@langchain/core/tools';

// Constants
import { OPENAI_API_KEY } from '@/constants';

// Services
import { searchMemories } from '@/services/memory';

// Infrastructure
import { memoryStore } from '@/infrastructure/persistence';
import { createChatModel } from '@/infrastructure/llm';

// Prompts
import { buildAgentSystemPrompt, type AgentPromptSections } from '@/prompts';

// State
import { GraphState, type GraphStateType } from '@/state';

// Utils
import { richUiModelMiddleware } from './rich-ui-middleware';
import { createDomainStateMiddleware, type DomainTaskName } from './domain-state-middleware';

const model = createChatModel({ apiKey: OPENAI_API_KEY! });

/** Builds a specialized agent with shared middleware and a dynamic system prompt. */
export const createSpecializedAgent = (
  tools: StructuredToolInterface[],
  sections: AgentPromptSections,
  taskName: DomainTaskName
) =>
  createAgent({
    model,
    tools,
    stateSchema: GraphState,
    middleware: [
      createCopilotkitMiddleware({ exposeState: false }),
      richUiModelMiddleware,
      createDomainStateMiddleware(taskName),
      dynamicSystemPromptMiddleware(async (state) => {
        const memories = sections.includeMemoryContext ? await searchMemories(memoryStore) : [];
        return buildAgentSystemPrompt(state as unknown as GraphStateType, sections, memories);
      }),
    ],
  }).graph;
