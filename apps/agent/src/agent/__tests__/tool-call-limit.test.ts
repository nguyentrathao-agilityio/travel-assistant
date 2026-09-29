import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TOOL_CALL_RUN_LIMIT } from '@/constants';

const { toolCallLimitMiddlewareMock } = vi.hoisted(() => ({
  toolCallLimitMiddlewareMock: vi.fn(() => 'tool-call-limit'),
}));

vi.mock('langchain', () => ({
  toolCallLimitMiddleware: toolCallLimitMiddlewareMock,
}));

describe('createToolCallLimitMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ends the run when the per-run tool limit is exceeded', async () => {
    const { createToolCallLimitMiddleware } = await import('@/agent/middleware/tool-call-limit');

    createToolCallLimitMiddleware();

    expect(toolCallLimitMiddlewareMock).toHaveBeenCalledWith({
      runLimit: TOOL_CALL_RUN_LIMIT,
      exitBehavior: 'end',
    });
  });
});
