import { describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock('../../infrastructure/llm', () => ({
  createChatModel: () => ({
    withStructuredOutput: () => ({ invoke: invokeMock }),
  }),
}));

import { classifyNode } from '../classify';
import type { GraphStateType } from '../../state';

describe('classifyNode', () => {
  it('returns a Command updating intent and routing to the matching branch', async () => {
    invokeMock.mockResolvedValueOnce({ intent: 'book_flight' });
    const state = { messages: [] } as unknown as GraphStateType;

    const result = await classifyNode(state);

    expect(result.update).toEqual({ intent: 'book_flight', handoffTarget: undefined });
    expect(result.goto).toEqual(['bookFlight']);
  });

  it('lets classification failures bubble so the graph retry policy can handle them', async () => {
    invokeMock.mockRejectedValueOnce(new Error('network error'));
    const state = { messages: [] } as unknown as GraphStateType;

    await expect(classifyNode(state)).rejects.toThrow('network error');
  });

  it('sends only the most recent messages, not the full history', async () => {
    invokeMock.mockResolvedValueOnce({ intent: 'general' });
    const messages = Array.from({ length: 10 }, (_, i) => ({ content: `msg ${i}` }));
    const state = { messages } as unknown as GraphStateType;

    await classifyNode(state);

    const callArgs = invokeMock.mock.calls[0][0] as unknown[];
    // 1 system message + at most 4 recent messages
    expect(callArgs.length).toBeLessThanOrEqual(5);
  });

  it('marks the classification call as not assistant-visible to the AG-UI bridge', async () => {
    invokeMock.mockResolvedValueOnce({ intent: 'plan' });
    const state = { messages: [] } as unknown as GraphStateType;

    await classifyNode(state);

    const config = invokeMock.mock.calls[0][1] as { metadata?: Record<string, unknown> };
    expect(config?.metadata?.['copilotkit:emit-messages']).toBe(false);
  });
});
