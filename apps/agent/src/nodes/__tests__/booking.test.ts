import { AIMessage } from '@langchain/core/messages';
import { describe, expect, it, vi } from 'vitest';

import { bookingAgent } from '@/nodes/booking';
import type { GraphStateType } from '@/state';

const createSpecializedAgentMock = vi.hoisted(() => vi.fn());

vi.mock('@/agent/create-agent', () => ({
  createSpecializedAgent: createSpecializedAgentMock,
}));

vi.mock('@/infrastructure/llm', () => ({
  openAiApiKeyFromConfig: vi.fn(() => 'sk-request'),
  withOpenAiApiKey: <T>(_apiKey: string, callback: () => T) => callback(),
}));

describe('bookingAgent', () => {
  it('responds without invoking the booking model when a flight booking is already active', async () => {
    const state = {
      bookingOperation: 'flight',
      flightBooking: {
        id: 'booking-1',
        confirmationCode: 'TRIP-FLIGHT-1',
        type: 'flight',
        referenceId: 'flight-1',
        customerName: 'Nguyen Van A',
        customerEmail: 'a@example.com',
        totalPrice: 100,
        currency: 'USD',
        status: 'confirmed',
        createdAt: '2026-08-05T10:00:00Z',
        summary: 'HAN to DAD',
      },
    } as GraphStateType;

    const result = await bookingAgent(state);
    const messages = result.messages as AIMessage[];

    expect(createSpecializedAgentMock).not.toHaveBeenCalled();
    expect(messages).toEqual([
      expect.objectContaining({
        content: expect.stringContaining('TRIP-FLIGHT-1'),
      }),
    ]);
    expect(messages[0]).toBeInstanceOf(AIMessage);
  });

  it('allows hotel booking work while only a flight booking is active', async () => {
    const invoke = vi.fn().mockResolvedValue({ messages: [] });
    createSpecializedAgentMock.mockReturnValue({ invoke });

    const state = {
      bookingOperation: 'hotel',
      flightBooking: {
        id: 'booking-1',
        confirmationCode: 'TRIP-FLIGHT-1',
        type: 'flight',
        referenceId: 'flight-1',
        customerName: 'Nguyen Van A',
        customerEmail: 'a@example.com',
        totalPrice: 100,
        currency: 'USD',
        status: 'confirmed',
        createdAt: '2026-08-05T10:00:00Z',
        summary: 'HAN to DAD',
      },
    } as GraphStateType;

    await bookingAgent(state);

    expect(invoke).toHaveBeenCalledWith(state, undefined);
  });
});
