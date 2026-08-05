import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import { describe, expect, it } from 'vitest';

import { MAX_RETRIES_PER_NODE, TOOL_NAMES } from '../../constants';
import type { GraphStateType, GraphStateUpdate } from '../../state';
import {
  routeAfterSupervisor,
  supervisorNode,
  validateExploreResult,
  validateFlightResult,
  validatePlanningResult,
} from '../supervisor';

const state = (overrides: Partial<GraphStateType> = {}): GraphStateType =>
  ({
    messages: [new HumanMessage('test')],
    request: {},
    searchResults: {},
    selectedOptions: { placeIds: [] },
    execution: { completedTasks: [], missingFields: [], errors: [], retryCount: {} },
    supervisor: { status: 'pending' },
    ...overrides,
  }) as GraphStateType;

const toolResult = (name: string, artifact: unknown) =>
  new ToolMessage({
    name,
    content: JSON.stringify(artifact),
    artifact,
    tool_call_id: `call-${name}`,
  });

const supervisorUpdate = (value: GraphStateUpdate) =>
  value.supervisor as GraphStateType['supervisor'];

describe('supervisor validation', () => {
  it('accepts a complete explore result', () => {
    const result = validateExploreResult(
      state({
        request: { destination: 'Da Nang' },
        searchResults: { places: { total: 0, results: [] } },
      })
    );

    expect(result).toMatchObject({ status: 'complete' });
  });

  it('keeps a multi-step explore request incomplete until every required result exists', () => {
    const result = validateExploreResult(
      state({
        request: { destination: 'Da Nang' },
        searchResults: { places: { total: 0, results: [] } },
        execution: {
          ...state().execution,
          requiredOperations: ['places', 'knowledge'],
        },
      })
    );

    expect(result).toMatchObject({ status: 'incomplete', retryable: true });
    expect(result.reason).toContain('knowledge');
  });

  it('finishes the turn instead of retrying when no required operation was fulfilled at all', () => {
    // Regression: a dateless trip-summary request has one required operation (tripSummary) and
    // zero fulfilled — the agent asked for dates instead of calling a tool. Retrying re-invokes
    // the same agent with identical state, which just repeats the same question until
    // MAX_RETRIES_PER_NODE is exhausted, producing duplicate "please provide dates" replies.
    const result = validatePlanningResult(
      state({
        request: { destination: 'Tokyo' },
        execution: {
          ...state().execution,
          requiredOperations: ['tripSummary'],
        },
      })
    );

    expect(result).toMatchObject({
      status: 'incomplete',
      missingFields: ['tripSummary'],
    });
    expect(result.retryable).toBeFalsy();
  });

  it('accepts a successful trip summary even when it has no route to persist to searchResults', () => {
    // Regression: domain-state-middleware only copies tripSummaryTool's artifact into
    // searchResults.route when the summary happens to include a route. A flight+hotel-only
    // summary leaves searchResults untouched, so hasResult must also check for the tool call
    // directly or a fully successful trip summary reads as incomplete and retries, producing
    // duplicate replies that re-narrate the card's contents as text.
    const messages = [
      new HumanMessage('Put together a full itinerary summary for my Tokyo trip, flying from HAN'),
      toolResult(TOOL_NAMES.TRIP_SUMMARY, {
        destination: 'Tokyo',
        flight: { airline: 'Thai AirAsia', price: 245 },
      }),
    ];
    const result = validatePlanningResult(
      state({
        messages,
        request: { destination: 'Tokyo' },
        execution: { ...state().execution, requiredOperations: ['tripSummary'] },
      })
    );

    expect(result).toMatchObject({ status: 'complete' });
  });

  it('finishes the invocation when destination input is missing', () => {
    const update = supervisorNode(
      state({ execution: { ...state().execution, currentNode: 'explore' } })
    );

    expect(supervisorUpdate(update)).toMatchObject({
      status: 'incomplete',
      nextNode: 'saveMemory',
    });
    expect(update.execution).toMatchObject({ missingFields: ['destination'] });
    expect(update.execution).toMatchObject({
      errors: [expect.objectContaining({ code: 'MISSING_INPUT', retryable: false })],
    });
  });

  it('retries a read-only agent when an expected weather result failed', () => {
    const messages = [
      new HumanMessage('What is the weather in Da Nang?'),
      toolResult('weatherTool', { error: 'weather unavailable' }),
    ];
    const update = supervisorNode(
      state({
        messages,
        request: { destination: 'Da Nang' },
        execution: { ...state().execution, currentNode: 'plan' },
      })
    );

    expect(supervisorUpdate(update)).toMatchObject({ status: 'failed', nextNode: 'plan' });
    expect(update.execution).toMatchObject({ retryCount: { plan: 1 } });
  });

  it('routes to failure after the maximum retry count', () => {
    const messages = [
      new HumanMessage('What is the weather in Da Nang?'),
      toolResult('weatherTool', { error: 'weather unavailable' }),
    ];
    const update = supervisorNode(
      state({
        messages,
        request: { destination: 'Da Nang' },
        execution: {
          ...state().execution,
          currentNode: 'plan',
          retryCount: { plan: MAX_RETRIES_PER_NODE },
        },
      })
    );

    expect(supervisorUpdate(update)).toMatchObject({ status: 'failed', nextNode: 'saveMemory' });
    expect(supervisorUpdate(update).reason).toContain('Maximum retries reached');
    expect(update.execution).toMatchObject({
      errors: [expect.objectContaining({ code: 'MAX_RETRY_EXCEEDED' })],
    });
  });

  it.each([
    ['TIMEOUT', 'plan'],
    ['RATE_LIMITED', 'plan'],
    ['AUTHENTICATION_FAILED', 'saveMemory'],
  ] as const)('routes structured %s failures safely', (code, nextNode) => {
    const artifact = {
      error: 'Safe provider message',
      message: 'Safe provider message',
      code,
      retryable: code === 'TIMEOUT' || code === 'RATE_LIMITED',
      provider: 'travel-api',
    };
    const update = supervisorNode(
      state({
        messages: [new HumanMessage('Search'), toolResult('hotelTool', artifact)],
        request: { destination: 'Da Nang' },
        execution: { ...state().execution, currentNode: 'plan' },
      })
    );

    expect(supervisorUpdate(update).nextNode).toBe(nextNode);
  });

  it('accepts a successful retry instead of replaying an earlier tool failure', () => {
    const weather = {
      location: { name: 'Da Nang', country: 'Vietnam', latitude: 16, longitude: 108 },
      current: {
        time: '2026-08-05T10:00:00+07:00',
        temperatureC: 30,
        apparentTemperatureC: 33,
        relativeHumidity: 70,
        windSpeedKmh: 10,
        description: 'Sunny',
      },
      travelTip: 'Bring water.',
    };
    const messages = [
      new HumanMessage('What is the weather in Da Nang?'),
      toolResult('weatherTool', { error: 'temporary failure' }),
      toolResult('weatherTool', weather),
    ];
    const update = supervisorNode(
      state({
        messages,
        request: { destination: 'Da Nang' },
        searchResults: { weather },
        execution: { ...state().execution, currentNode: 'plan', retryCount: { plan: 1 } },
      })
    );

    expect(supervisorUpdate(update)).toMatchObject({ status: 'complete', nextNode: 'saveMemory' });
  });

  it('treats a populated hotel result as complete', () => {
    const result = validatePlanningResult(
      state({
        request: { destination: 'Da Nang' },
        searchResults: {
          hotels: {
            total: 1,
            limit: 20,
            offset: 0,
            results: [
              {
                id: 'hotel-1',
                shortCode: 'HTL-1',
                code: 'HTL1',
                name: 'Hotel One',
                city: 'Da Nang',
                country: 'Vietnam',
                address: '1 Beach Road',
                starRating: 4,
                pricePerNight: 100,
                currency: 'USD',
                amenities: ['wifi'],
                rating: 4.5,
                reviewCount: 100,
                imageUrl: 'https://example.com/hotel.jpg',
                available: true,
                availableRooms: 2,
                maxOccupancyPerRoom: 2,
                nights: 2,
                totalPrice: 200,
              },
            ],
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

    expect(result).toMatchObject({ status: 'complete' });
  });

  it('treats an empty hotel search as a completed no-results outcome', () => {
    const result = validatePlanningResult(
      state({
        request: { destination: 'Da Nang' },
        searchResults: {
          hotels: {
            total: 0,
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

    expect(result).toMatchObject({ status: 'complete' });
    expect(result.reason).toContain('no matching results');
  });

  it('keeps a multi-step request incomplete until every required operation has a result', () => {
    const weather = {} as GraphStateType['searchResults']['weather'];
    const result = validatePlanningResult(
      state({
        request: { destination: 'Da Nang' },
        searchResults: { weather },
        execution: {
          ...state().execution,
          requiredOperations: ['weather', 'hotels'],
        },
      })
    );

    expect(result).toMatchObject({ status: 'incomplete', retryable: true });
    expect(result.reason).toContain('hotels');
  });

  it('completes a multi-step request when all required results exist, including empty results', () => {
    const result = validatePlanningResult(
      state({
        request: { destination: 'Da Nang' },
        searchResults: {
          weather: {} as GraphStateType['searchResults']['weather'],
          hotels: {
            total: 0,
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
        execution: {
          ...state().execution,
          requiredOperations: ['weather', 'hotels'],
        },
      })
    );

    expect(result).toMatchObject({ status: 'complete' });
  });

  it('recognizes a complete booking draft without executing another write', () => {
    const result = validateFlightResult(
      state({ selectedOptions: { flightId: 'flight-1', placeIds: [] } })
    );

    expect(result).toMatchObject({ status: 'incomplete' });
    expect(result.reason).toContain('draft');
  });

  it('marks a booking timeout as unknown instead of retrying the write', () => {
    const timeout = {
      error: 'Provider request timed out',
      message: 'Provider request timed out',
      code: 'TIMEOUT',
      retryable: false,
      provider: 'travel-api',
    };
    const update = supervisorNode(
      state({
        messages: [new HumanMessage('Book it'), toolResult('bookFlightTool', timeout)],
        selectedOptions: { flightId: 'flight-1', placeIds: [] },
        execution: { ...state().execution, currentNode: 'bookFlight' },
      })
    );

    expect(supervisorUpdate(update)).toMatchObject({ status: 'failed', nextNode: 'saveMemory' });
    expect(update.execution).toMatchObject({
      errors: [expect.objectContaining({ code: 'WRITE_STATUS_UNKNOWN', retryable: false })],
    });
  });

  it('falls back safely for an unknown next route', () => {
    const invalid = state({
      supervisor: { status: 'complete', nextNode: 'unknown' as 'saveMemory' },
    });

    expect(routeAfterSupervisor(invalid)).toBe('saveMemory');
  });

  it('bounds every semantic retry cycle', () => {
    for (let retryCount = 0; retryCount <= MAX_RETRIES_PER_NODE; retryCount += 1) {
      const update = supervisorNode(
        state({
          request: { destination: 'Da Nang' },
          execution: {
            ...state().execution,
            currentNode: 'plan',
            retryCount: { plan: retryCount },
          },
        })
      );
      const route = supervisorUpdate(update).nextNode;
      expect(route).toBe(retryCount < MAX_RETRIES_PER_NODE ? 'plan' : 'saveMemory');
    }
  });
});
