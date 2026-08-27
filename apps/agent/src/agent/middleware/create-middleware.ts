import { createCopilotkitMiddleware } from '@copilotkit/sdk-js/langgraph';
import { modelFallbackMiddleware } from 'langchain';

import type { SpecializedAgentConfig } from '@/constants/agent-config';
import { createApprovalMiddleware } from './approval';
import { createDomainStateMiddleware } from './domain-state';
import { createModerationMiddleware } from './moderation';
import { createObservabilityMiddleware } from './observability';
import { richUiModelMiddleware } from './rich-ui';
import { createSystemPromptMiddleware } from './system-prompt';

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
  createModerationMiddleware(model),
  createDomainStateMiddleware(config.name),
  ...createApprovalMiddleware(config.approvalTools),
  createObservabilityMiddleware(config.name),
  richUiModelMiddleware,
  createSystemPromptMiddleware(config.prompt),
  modelFallbackMiddleware(fallbackModel),
];
