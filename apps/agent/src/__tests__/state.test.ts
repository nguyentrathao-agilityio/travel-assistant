import { HumanMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';

import {
  GraphState,
  mergeExecutionState,
  mergeRequest,
  mergeSearchResults,
  normalizeGraphState,
  type ExecutionState,
} from '@/state';

const execution = (): ExecutionState => ({
  completedTasks: [],
  missingFields: [],
  errors: [],
  retryCount: {},
  requiredOperations: [],
});

describe('GraphState', () => {
  it.each(['flight', 'hotel', 'cancel'] as const)(
    'declares state for the supported booking operation %s',
    (bookingOperation) => {
      const channels = GraphState.getChannels();

      expect(channels).toHaveProperty('bookingOperation');
      expect(bookingOperation).toMatch(/^(flight|hotel|cancel)$/);
    }
  );

  it('declares state channels for confirmed booking records', () => {
    const channels = GraphState.getChannels();

    expect(channels).toHaveProperty('flightBooking');
    expect(channels).toHaveProperty('hotelBooking');
  });

  it('uses independent safe defaults for collection state', async () => {
    const first = normalizeGraphState({});
    const second = normalizeGraphState({});

    expect(first.execution).toEqual(execution());
    expect(first.selectedOptions).toEqual({ placeIds: [] });
    expect(first.execution).not.toBe(second.execution);
    expect(first.execution?.completedTasks).not.toBe(second.execution?.completedTasks);
  });

  it('preserves unrelated request fields in a partial update', () => {
    expect(
      mergeRequest(
        { origin: 'HAN', destination: 'SGN', departureDate: '2026-09-01' },
        { destination: 'DAD' }
      )
    ).toEqual({ origin: 'HAN', destination: 'DAD', departureDate: '2026-09-01' });
  });

  it('updates one search result without removing other provider results', () => {
    const flights = { count: 0, results: [] };
    const hotels = {
      total: 0,
      limit: 20,
      offset: 0,
      results: [],
      search: {
        city: 'Da Nang',
        checkIn: '2026-09-01',
        checkOut: '2026-09-02',
        nights: 1,
        rooms: 1,
      },
    };

    expect(mergeSearchResults({ flights }, { hotels })).toEqual({ flights, hotels });
  });

  it('merges retry counters by node', () => {
    expect(
      mergeExecutionState(
        { ...execution(), retryCount: { classify: 1 } },
        {
          retryCount: { explore: 2 },
        }
      ).retryCount
    ).toEqual({ classify: 1, explore: 2 });
  });

  it('deduplicates completed tasks, replaces missing fields, and appends errors', () => {
    const result = mergeExecutionState(
      {
        ...execution(),
        completedTasks: ['classify'],
        missingFields: ['origin'],
        errors: [
          { node: 'classify', code: 'PROVIDER_ERROR', message: 'temporary', retryable: false },
        ],
      },
      {
        completedTasks: ['classify', 'plan'],
        missingFields: ['dates'],
        errors: [
          { node: 'plan', code: 'VALIDATION_ERROR', message: 'invalid dates', retryable: false },
        ],
      }
    );

    expect(result.completedTasks).toEqual(['classify', 'plan']);
    expect(result.missingFields).toEqual(['dates']);
    expect(result.errors).toHaveLength(2);
  });

  it('retains the official messages reducer and produces serializable business state', async () => {
    const channel = GraphState.getChannels().messages;

    channel.update([[new HumanMessage('hello')]]);
    channel.update([[new HumanMessage('again')]]);
    expect(channel.get()).toHaveLength(2);

    const normalized = normalizeGraphState({ destination: 'Tokyo', travelers: 2 });

    expect(normalized.request).toMatchObject({ destination: 'Tokyo', travelers: 2 });
    expect(() => JSON.stringify(normalized)).not.toThrow();
  });
});
