import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createObservabilityMiddleware } from '@/agent/middleware/observability';

const createMiddlewareMock = vi.hoisted(() => vi.fn((config: unknown) => config));

vi.mock('langchain', () => ({ createMiddleware: createMiddlewareMock }));

const logger = {
  info: vi.fn(),
  error: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('createObservabilityMiddleware', () => {
  it('records model completion without logging messages', async () => {
    const middleware = createObservabilityMiddleware('booking', logger) as unknown as {
      wrapModelCall: (request: unknown, handler: (request: unknown) => Promise<unknown>) => unknown;
    };
    const request = { messages: [{ content: 'email secret@example.com' }] };

    await middleware.wrapModelCall(request, vi.fn().mockResolvedValue({ usage_metadata: {} }));

    expect(logger.info).toHaveBeenCalledWith(
      '[agent-observability]',
      expect.objectContaining({ agent: 'booking', operation: 'model', status: 'success' })
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('secret@example.com');
  });

  it('records tool failure without logging tool arguments or raw errors', async () => {
    const middleware = createObservabilityMiddleware('booking', logger) as unknown as {
      wrapToolCall: (request: unknown, handler: (request: unknown) => Promise<unknown>) => unknown;
    };
    const request = {
      toolCall: { name: 'bookHotelTool', args: { customerPhone: '0900000000' } },
    };
    const handler = vi.fn().mockRejectedValue(new Error('provider leaked secret@example.com'));

    await expect(middleware.wrapToolCall(request, handler)).rejects.toThrow('provider leaked');

    expect(logger.error).toHaveBeenCalledWith(
      '[agent-observability]',
      expect.objectContaining({
        agent: 'booking',
        operation: 'tool',
        tool: 'bookHotelTool',
        status: 'error',
        errorType: 'Error',
      })
    );
    const logs = JSON.stringify(logger.error.mock.calls);
    expect(logs).not.toContain('0900000000');
    expect(logs).not.toContain('secret@example.com');
  });
});
