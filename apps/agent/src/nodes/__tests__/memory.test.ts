import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToolMessage } from '@langchain/core/messages';

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));
const saveMemoryMock = vi.fn();

vi.mock('../../infrastructure/llm', () => ({
  createChatModel: () => ({
    withStructuredOutput: () => ({ invoke: invokeMock }),
  }),
}));

vi.mock('../../infrastructure/persistence/memory-store', () => ({
  memoryStore: { fake: 'store' },
}));

vi.mock('../../services/memory', () => ({
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
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    invokeMock.mockRejectedValueOnce(new Error('network error'));
    const state = { messages: [] } as unknown as GraphStateType;

    const result = await saveMemoryNode(state);

    expect(result).toEqual({});
    expect(saveMemoryMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      '[memory] Failed to extract or save long-term memory',
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it.each(['bookFlightTool', 'bookHotelTool', 'cancelBookingTool'])(
    'skips extraction entirely when a %s result is in the recent window, so passenger/guest contact details never get saved as a preference',
    async (toolName) => {
      const state = {
        messages: [new ToolMessage({ content: '{}', tool_call_id: 'call_1', name: toolName })],
      } as unknown as GraphStateType;

      const result = await saveMemoryNode(state);

      expect(invokeMock).not.toHaveBeenCalled();
      expect(saveMemoryMock).not.toHaveBeenCalled();
      expect(result).toEqual({});
    }
  );

  it('still extracts normally when the recent window has a non-booking tool result', async () => {
    invokeMock.mockResolvedValueOnce({ memory: 'Home city: Da Nang' });
    const state = {
      messages: [new ToolMessage({ content: '{}', tool_call_id: 'call_1', name: 'weatherTool' })],
    } as unknown as GraphStateType;

    await saveMemoryNode(state);

    expect(invokeMock).toHaveBeenCalled();
    expect(saveMemoryMock).toHaveBeenCalledWith({ fake: 'store' }, 'Home city: Da Nang');
  });

  it('marks the extraction call as not assistant-visible to the AG-UI bridge', async () => {
    invokeMock.mockResolvedValueOnce({ memory: null });
    const state = { messages: [] } as unknown as GraphStateType;

    await saveMemoryNode(state);

    const config = invokeMock.mock.calls[0][1] as { metadata?: Record<string, unknown> };
    expect(config?.metadata?.['copilotkit:emit-messages']).toBe(false);
  });
});
