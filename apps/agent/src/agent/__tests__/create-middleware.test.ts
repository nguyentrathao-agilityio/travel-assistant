import type { StructuredToolInterface } from '@langchain/core/tools';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SpecializedAgentConfig } from '@/constants/agent-config';
import { createAgentMiddleware } from '@/agent/middleware/create-middleware';

const {
  createCopilotkitMiddlewareMock,
  createSummarizationMiddlewareMock,
  createModerationMiddlewareMock,
  createApprovalMiddlewareMock,
  createObservabilityMiddlewareMock,
  createDomainStateMiddlewareMock,
  createSystemPromptMiddlewareMock,
  createToolCallLimitMiddlewareMock,
  createModelRetryMiddlewareMock,
  modelFallbackMiddlewareMock,
} = vi.hoisted(() => ({
  createCopilotkitMiddlewareMock: vi.fn(() => 'copilotkit'),
  createSummarizationMiddlewareMock: vi.fn(() => 'summarization'),
  createModerationMiddlewareMock: vi.fn(() => 'moderation'),
  createApprovalMiddlewareMock: vi.fn(() => ['approval']),
  createObservabilityMiddlewareMock: vi.fn(() => 'observability'),
  createDomainStateMiddlewareMock: vi.fn(() => 'domain-state'),
  createSystemPromptMiddlewareMock: vi.fn(() => 'system-prompt'),
  createToolCallLimitMiddlewareMock: vi.fn(() => 'tool-call-limit'),
  createModelRetryMiddlewareMock: vi.fn(() => 'model-retry'),
  modelFallbackMiddlewareMock: vi.fn(() => 'model-fallback'),
}));

vi.mock('langchain', () => ({
  modelFallbackMiddleware: modelFallbackMiddlewareMock,
}));

vi.mock('@copilotkit/sdk-js/langgraph', () => ({
  createCopilotkitMiddleware: createCopilotkitMiddlewareMock,
}));

vi.mock('@/agent/middleware/summarization', () => ({
  createSummarizationMiddleware: createSummarizationMiddlewareMock,
}));

vi.mock('@/agent/middleware/tool-call-limit', () => ({
  createToolCallLimitMiddleware: createToolCallLimitMiddlewareMock,
}));

vi.mock('@/agent/middleware/model-retry', () => ({
  createModelRetryMiddleware: createModelRetryMiddlewareMock,
}));

vi.mock('@/agent/middleware/moderation', () => ({
  createModerationMiddleware: createModerationMiddlewareMock,
}));

vi.mock('@/agent/middleware/approval', () => ({
  createApprovalMiddleware: createApprovalMiddlewareMock,
}));

vi.mock('@/agent/middleware/observability', () => ({
  createObservabilityMiddleware: createObservabilityMiddlewareMock,
}));

vi.mock('@/agent/middleware/rich-ui', () => ({
  richUiModelMiddleware: 'rich-ui',
}));

vi.mock('@/agent/middleware/domain-state', () => ({
  createDomainStateMiddleware: createDomainStateMiddlewareMock,
}));

vi.mock('@/agent/middleware/system-prompt', () => ({
  createSystemPromptMiddleware: createSystemPromptMiddlewareMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('createAgentMiddleware', () => {
  it('composes shared middleware in execution order', () => {
    const config: SpecializedAgentConfig = {
      name: 'booking',
      tools: [] as unknown as StructuredToolInterface[],
      approvalTools: ['bookFlightTool'],
      prompt: { toolsSection: 'Booking tools.' },
    };
    const model = { id: 'model' } as never;
    const fallbackModel = { id: 'fallback-model' } as never;

    expect(createAgentMiddleware({ config, model, fallbackModel })).toEqual([
      'copilotkit',
      'summarization',
      'moderation',
      'domain-state',
      'tool-call-limit',
      'approval',
      'observability',
      'rich-ui',
      'system-prompt',
      'model-fallback',
      'model-retry',
    ]);
    expect(createSummarizationMiddlewareMock).toHaveBeenCalledWith(model);
    expect(createModerationMiddlewareMock).toHaveBeenCalledWith(model);
    expect(createApprovalMiddlewareMock).toHaveBeenCalledWith(config.approvalTools);
    expect(createSystemPromptMiddlewareMock).toHaveBeenCalledWith(config.prompt);
    expect(modelFallbackMiddlewareMock).toHaveBeenCalledWith(fallbackModel);
  });
});
