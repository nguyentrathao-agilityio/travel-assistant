import { createCopilotkitMiddleware } from '@copilotkit/sdk-js/langgraph';
import { createAgent, dynamicSystemPromptMiddleware, humanInTheLoopMiddleware } from 'langchain';

// Constants
import type { SpecializedAgentConfig } from '@/constants/agent-config';

// Infrastructure
import { createChatModel } from '@/infrastructure/llm';
import { memoryStore } from '@/infrastructure/persistence';

// Prompts
import { buildAgentSystemPrompt } from '@/prompts';

// Services
import { searchMemories } from '@/services/memory';

// State
import { GraphState, type GraphStateType } from '@/state';

// Utils
import { createDomainStateMiddleware } from './domain-state-middleware';
import { richUiModelMiddleware } from './rich-ui-middleware';

/** Builds a specialized agent with shared middleware and a dynamic system prompt. */
export const createSpecializedAgent = (config: SpecializedAgentConfig, apiKey: string) =>
  createAgent({
    model: createChatModel({ apiKey }),
    tools: config.tools,
    stateSchema: GraphState,
    middleware: [
      createCopilotkitMiddleware({ exposeState: false }),
      ...(config.approvalTools?.length
        ? [
            humanInTheLoopMiddleware({
              interruptOn: Object.fromEntries(
                config.approvalTools.map((toolName) => [
                  toolName,
                  { allowedDecisions: ['approve', 'reject'] as const },
                ])
              ),
            }),
          ]
        : []),
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
