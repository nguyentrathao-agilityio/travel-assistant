import type { StructuredToolInterface } from '@langchain/core/tools';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SpecializedAgentConfig } from '@/constants/agent-config';
import { createAgentMiddleware } from '@/agent/middleware/create-middleware';

const {
  createCopilotkitMiddlewareMock,
  createModerationMiddlewareMock,
  createApprovalMiddlewareMock,
  createObservabilityMiddlewareMock,
  createDomainStateMiddlewareMock,
  createSystemPromptMiddlewareMock,
} = vi.hoisted(() => ({
  createCopilotkitMiddlewareMock: vi.fn(() => 'copilotkit'),
  createModerationMiddlewareMock: vi.fn(() => 'moderation'),
  createApprovalMiddlewareMock: vi.fn(() => ['approval']),
  createObservabilityMiddlewareMock: vi.fn(() => 'observability'),
  createDomainStateMiddlewareMock: vi.fn(() => 'domain-state'),
  createSystemPromptMiddlewareMock: vi.fn(() => 'system-prompt'),
}));

vi.mock('@copilotkit/sdk-js/langgraph', () => ({
  createCopilotkitMiddleware: createCopilotkitMiddlewareMock,
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

    expect(createAgentMiddleware({ config, model })).toEqual([
      'copilotkit',
      'moderation',
      'approval',
      'observability',
      'rich-ui',
      'domain-state',
      'system-prompt',
    ]);
    expect(createModerationMiddlewareMock).toHaveBeenCalledWith(model);
    expect(createApprovalMiddlewareMock).toHaveBeenCalledWith(config.approvalTools);
    expect(createSystemPromptMiddlewareMock).toHaveBeenCalledWith(config.prompt);
  });
});
