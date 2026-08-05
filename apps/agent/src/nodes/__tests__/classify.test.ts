import { describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock('../../infrastructure/llm', () => ({
  createChatModel: () => ({
    withStructuredOutput: () => ({ invoke: invokeMock }),
  }),
}));

import { classifyNode } from '../classify';
import {
  mergeRequest,
  type GraphStateType,
  type GraphStateUpdate,
  type TravelRequest,
} from '../../state';

const state = (overrides: Partial<GraphStateType> = {}): GraphStateType =>
  ({ messages: [], ...overrides }) as GraphStateType;

const classification = (
  intent: 'general' | 'explore' | 'plan' | 'book_flight' | 'book_hotel' | 'cancel_booking',
  extractedFields: Record<string, unknown> = {},
  confidence = 0.9,
  requiredOperations: Array<
    'weather' | 'flights' | 'hotels' | 'places' | 'route' | 'tripSummary' | 'knowledge'
  > = []
) => ({
  intent,
  confidence,
  requiredOperations,
  extractedFields: {
    origin: null,
    destination: null,
    departureDate: null,
    returnDate: null,
    travelers: null,
    budget: null,
    ...extractedFields,
  },
});

const updateOf = (result: Awaited<ReturnType<typeof classifyNode>>): GraphStateUpdate =>
  result.update as GraphStateUpdate;

describe('classifyNode', () => {
  it.each([
    ['general', 'general'],
    ['explore', 'explore'],
    ['plan', 'plan'],
    ['book_flight', 'bookFlight'],
    ['book_hotel', 'bookHotel'],
    ['cancel_booking', 'cancelBooking'],
  ] as const)('stores and routes the %s intent to %s', async (intent, branch) => {
    invokeMock.mockResolvedValueOnce(classification(intent));

    const result = await classifyNode(state());

    expect(result.update).toMatchObject({
      intent,
      request: { intent, confidence: 0.9 },
      execution: { currentNode: 'classify', completedTasks: ['classify'] },
      handoffTarget: undefined,
    });
    expect(result.goto).toEqual([branch]);
  });

  it('stores only fields extracted from the latest request', async () => {
    invokeMock.mockResolvedValueOnce(
      classification('plan', { destination: 'Da Nang', travelers: 2 })
    );

    const result = await classifyNode(state());

    expect(updateOf(result).request).toEqual({
      intent: 'plan',
      confidence: 0.9,
      destination: 'Da Nang',
      travelers: 2,
    });
  });

  it('preserves omitted request fields through the request reducer', async () => {
    invokeMock.mockResolvedValueOnce(classification('plan', { destination: 'Hoi An' }));
    const currentRequest = {
      origin: 'HAN',
      destination: 'Da Nang',
      departureDate: '2026-08-14',
      travelers: 2,
    };

    const result = await classifyNode(state({ request: currentRequest }));
    const merged = mergeRequest(
      currentRequest,
      (updateOf(result).request ?? {}) as Partial<TravelRequest>
    );

    expect(merged).toMatchObject({
      origin: 'HAN',
      destination: 'Hoi An',
      departureDate: '2026-08-14',
      travelers: 2,
    });
  });

  it('removes null structured-output fields before updating request state', async () => {
    invokeMock.mockResolvedValueOnce(classification('plan', { destination: 'Hoi An' }));

    const result = await classifyNode(state());

    expect(updateOf(result).request).toEqual({
      intent: 'plan',
      confidence: 0.9,
      destination: 'Hoi An',
    });
  });

  it('invalidates destination-dependent results and selections when destination changes', async () => {
    invokeMock.mockResolvedValueOnce(
      classification('plan', { destination: 'Hoi An' }, 0.9, ['hotels'])
    );
    const result = await classifyNode(
      state({
        request: { destination: 'Da Nang', departureDate: '2026-08-14' },
        searchResults: {
          weather: {} as GraphStateType['searchResults']['weather'],
          hotels: {} as GraphStateType['searchResults']['hotels'],
          places: {} as GraphStateType['searchResults']['places'],
        },
        selectedOptions: { hotelId: 'hotel-da-nang', placeIds: ['place-1'] },
        hotel: { id: 'hotel-da-nang' } as GraphStateType['hotel'],
        hotelSelectionStatus: 'selected',
      })
    );
    const update = updateOf(result);

    expect(update).toMatchObject({
      destination: 'Hoi An',
      request: { destination: 'Hoi An' },
      selectedOptions: { placeIds: [] },
      execution: { requiredOperations: ['hotels'] },
    });
    expect(update.searchResults).toEqual({
      flights: undefined,
      hotels: undefined,
      weather: undefined,
      places: undefined,
      route: undefined,
      localTips: undefined,
    });
    expect(update.hotel).toBeUndefined();
    expect(update.hotelSelectionStatus).toBeUndefined();
  });

  it('supplies previous state for follow-up interpretation', async () => {
    invokeMock.mockResolvedValueOnce(classification('book_hotel'));

    await classifyNode(
      state({
        request: { destination: 'Da Nang' },
        selectedOptions: { hotelId: 'hotel-2', placeIds: [] },
        searchResults: {
          hotels: {
            total: 2,
            limit: 20,
            offset: 0,
            results: [],
            search: {
              city: 'Da Nang',
              checkIn: '2026-08-14',
              checkOut: '2026-08-16',
              nights: 2,
              rooms: 1,
            },
          },
        },
      })
    );

    const messages = invokeMock.mock.calls.at(-1)?.[0] as Array<{ content: string }>;
    expect(messages[1].content).toContain('"destination":"Da Nang"');
    expect(messages[1].content).toContain('"hotelId":"hotel-2"');
  });

  it('falls back safely for an ambiguous classification', async () => {
    invokeMock.mockResolvedValueOnce(classification('general', {}, 0.2));

    const result = await classifyNode(state());

    expect(updateOf(result).intent).toBe('general');
    expect(result.goto).toEqual(['general']);
  });

  it('falls back to general when returned structured data is invalid', async () => {
    invokeMock.mockResolvedValueOnce({ intent: 'delete_everything' });

    const result = await classifyNode(state());

    expect(updateOf(result).request).toEqual({ intent: 'general', confidence: 0 });
    expect(result.goto).toEqual(['general']);
  });

  it('lets transport failures bubble so the graph retry policy can handle them', async () => {
    invokeMock.mockRejectedValueOnce(new Error('network error'));

    await expect(classifyNode(state())).rejects.toThrow('network error');
  });

  it('sends only recent messages plus prompt and state context', async () => {
    invokeMock.mockResolvedValueOnce(classification('general'));
    const messages = Array.from({ length: 10 }, (_, i) => ({ content: `msg ${i}` }));

    await classifyNode(state({ messages: messages as GraphStateType['messages'] }));

    const callArgs = invokeMock.mock.calls.at(-1)?.[0] as unknown[];
    expect(callArgs).toHaveLength(6);
  });

  it('marks the classification call as not assistant-visible to the AG-UI bridge', async () => {
    invokeMock.mockResolvedValueOnce(classification('plan'));

    await classifyNode(state());

    const config = invokeMock.mock.calls.at(-1)?.[1] as { metadata?: Record<string, unknown> };
    expect(config?.metadata?.['copilotkit:emit-messages']).toBe(false);
  });
});
