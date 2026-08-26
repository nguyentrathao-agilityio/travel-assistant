import { describe, expect, it, vi } from 'vitest';

import { createDomainStateMiddleware } from '@/agent/middleware/domain-state';

const createMiddlewareMock = vi.hoisted(() => vi.fn((config: unknown) => config));

vi.mock('langchain', () => ({ createMiddleware: createMiddlewareMock }));

describe('booking guard', () => {
  it('blocks a second flight booking while a confirmed flight booking is active', async () => {
    const middleware = createDomainStateMiddleware('booking') as unknown as {
      wrapToolCall: (
        request: unknown,
        handler: ReturnType<typeof vi.fn>
      ) => Promise<{
        content: string;
      }>;
    };
    const handler = vi.fn();

    const result = await middleware.wrapToolCall(
      {
        toolCall: { id: 'call-1', name: 'bookFlightTool' },
        state: {
          flightBooking: {
            confirmationCode: 'TRIP-FLIGHT-1',
            status: 'confirmed',
          },
        },
      },
      handler
    );

    expect(handler).not.toHaveBeenCalled();
    expect(result.content).toContain('TRIP-FLIGHT-1');
    expect(result.content).toContain('Cancel the active booking');
  });
});
