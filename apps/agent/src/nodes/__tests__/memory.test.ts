import { afterEach, describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));
const saveMemoryMock = vi.fn();

vi.mock('../../llm', () => ({
  createChatModel: () => ({
    withStructuredOutput: () => ({ invoke: invokeMock }),
  }),
}));

vi.mock('../../services', () => ({
  memoryStore: { fake: 'store' },
  saveMemory: (...args: unknown[]) => saveMemoryMock(...args),
}));

import { saveMemoryNode } from '../memory';
import type { GraphStateType } from '../../state';

afterEach(() => {
  vi.clearAllMocks();
});

describe('saveMemoryNode', () => {
  it('saves the extracted fact when the model returns one', async () => {
    invokeMock.mockResolvedValueOnce({ memory: 'Departure city: Da Nang' });
    const state = { messages: [] } as unknown as GraphStateType;

    const result = await saveMemoryNode(state);

    expect(saveMemoryMock).toHaveBeenCalledWith({ fake: 'store' }, 'Departure city: Da Nang');
    expect(result).toEqual({});
  });

  it('does not save anything when the model finds no durable fact', async () => {
    invokeMock.mockResolvedValueOnce({ memory: null });
    const state = { messages: [] } as unknown as GraphStateType;

    await saveMemoryNode(state);

    expect(saveMemoryMock).not.toHaveBeenCalled();
  });

  it('does not save the literal string "null" some models return instead of JSON null', async () => {
    invokeMock.mockResolvedValueOnce({ memory: 'null' });
    const state = { messages: [] } as unknown as GraphStateType;

    await saveMemoryNode(state);

    expect(saveMemoryMock).not.toHaveBeenCalled();
  });

  it('never throws when extraction fails, so a broken save can never block the response', async () => {
    invokeMock.mockRejectedValueOnce(new Error('network error'));
    const state = { messages: [] } as unknown as GraphStateType;

    const result = await saveMemoryNode(state);

    expect(result).toEqual({});
    expect(saveMemoryMock).not.toHaveBeenCalled();
  });

  it('marks the extraction call as not assistant-visible to the AG-UI bridge', async () => {
    invokeMock.mockResolvedValueOnce({ memory: null });
    const state = { messages: [] } as unknown as GraphStateType;

    await saveMemoryNode(state);

    const config = invokeMock.mock.calls[0][1] as { metadata?: Record<string, unknown> };
    expect(config?.metadata?.['copilotkit:emit-messages']).toBe(false);
  });
});
