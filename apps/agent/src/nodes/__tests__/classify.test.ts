import { describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock('../../llm', () => ({
  createChatModel: () => ({
    withStructuredOutput: () => ({ invoke: invokeMock }),
  }),
}));

import { classifyNode } from '../classify';
import { FALLBACK_INTENT } from '../../constants';
import type { GraphStateType } from '../../state';

describe('classifyNode', () => {
  it('returns a Command updating intent and routing to the matching branch', async () => {
    invokeMock.mockResolvedValueOnce({ intent: 'book_flight' });
    const state = { messages: [] } as unknown as GraphStateType;

    const result = await classifyNode(state);

    expect(result.update).toEqual({ intent: 'book_flight' });
    expect(result.goto).toEqual(['bookFlight']);
  });

  it('falls back to the default intent and its branch when classification throws', async () => {
    invokeMock.mockRejectedValueOnce(new Error('network error'));
    const state = { messages: [] } as unknown as GraphStateType;

    const result = await classifyNode(state);

    expect(result.update).toEqual({ intent: FALLBACK_INTENT });
    expect(result.goto).toEqual(['general']);
    expect(FALLBACK_INTENT).toBe('general');
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
