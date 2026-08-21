import { createCopilotkitMiddleware } from '@copilotkit/sdk-js/langgraph';

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
}

export const createAgentMiddleware = ({ config, model }: CreateAgentMiddlewareOptions) => [
  createCopilotkitMiddleware(),
  createModerationMiddleware(model),
  ...createApprovalMiddleware(config.approvalTools),
  createObservabilityMiddleware(config.name),
  richUiModelMiddleware,
  createDomainStateMiddleware(config.name),
  createSystemPromptMiddleware(config.prompt),
];
