import { createCopilotkitMiddleware } from '@copilotkit/sdk-js/langgraph';
import {
  createAgent,
  dynamicSystemPromptMiddleware,
  humanInTheLoopMiddleware,
  openAIModerationMiddleware,
} from 'langchain';

// Constants
import type { SpecializedAgentConfig } from '@/constants/agent-config';

// Infrastructure
import { createChatModel } from '@/infrastructure/llm';
import { memoryStore } from '@/infrastructure/persistence';
import { createObservabilityMiddleware } from './observability';

// Prompts
import { buildAgentSystemPrompt } from '@/prompts';

// Services
import { searchMemories } from '@/services/memory';

// State
import { GraphState, type GraphStateType } from '@/state';

// Utils
import { createDomainStateMiddleware } from '@/utils/domain-state';
import { richUiModelMiddleware } from '@/utils/rich-ui';

/** Builds a specialized agent with shared middleware and a dynamic system prompt. */
export const createSpecializedAgent = (config: SpecializedAgentConfig, apiKey: string) => {
  const model = createChatModel({ apiKey });

  return createAgent({
    model,
    tools: config.tools,
    stateSchema: GraphState,
    middleware: [
      createCopilotkitMiddleware({ exposeState: false }),
      openAIModerationMiddleware({
        model,
        moderationModel: 'omni-moderation-latest',
        checkInput: true,
        checkOutput: true,
        checkToolResults: false,
        exitBehavior: 'end',
        violationMessage: "I can't help with that request.",
      }),
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
      createObservabilityMiddleware(config.name),
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
};
