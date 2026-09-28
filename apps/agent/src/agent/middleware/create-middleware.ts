import { createCopilotkitMiddleware } from '@copilotkit/sdk-js/langgraph';
import { modelFallbackMiddleware } from 'langchain';

import type { SpecializedAgentConfig } from '@/constants/agent-config';
import { createApprovalMiddleware } from './approval';
import { createDomainStateMiddleware } from './domain-state';
import { createModelRetryMiddleware } from './model-retry';
import { createModerationMiddleware } from './moderation';
import { createObservabilityMiddleware } from './observability';
import { richUiModelMiddleware } from './rich-ui';
import { createSummarizationMiddleware } from './summarization';
import { createSystemPromptMiddleware } from './system-prompt';
import { createToolCallLimitMiddleware } from './tool-call-limit';
import { toolMessageOrderMiddleware } from './tool-message-order';
import { createTranscriptMiddleware } from './transcript';

type AgentModel = Parameters<typeof createModerationMiddleware>[0];

interface CreateAgentMiddlewareOptions {
  config: SpecializedAgentConfig;
  model: AgentModel;
  fallbackModel: AgentModel;
}

export const createAgentMiddleware = ({
  config,
  model,
  fallbackModel,
}: CreateAgentMiddlewareOptions) => [
  createCopilotkitMiddleware(),
  createSummarizationMiddleware(model),
  createTranscriptMiddleware(),
  createModerationMiddleware(model),
  createDomainStateMiddleware(config.name),
  createToolCallLimitMiddleware(),
  ...createApprovalMiddleware(config.approvalTools),
  createObservabilityMiddleware(config.name),
  toolMessageOrderMiddleware,
  richUiModelMiddleware,
  createSystemPromptMiddleware(config.prompt),
  modelFallbackMiddleware(fallbackModel),
  createModelRetryMiddleware(),
];
