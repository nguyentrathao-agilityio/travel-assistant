import { afterEach, describe, expect, it, vi } from 'vitest';

const getTripSummaryMock = vi.fn();

vi.mock('../../services/trip-summary', () => ({
  getTripSummary: (...args: unknown[]) => getTripSummaryMock(...args),
}));

import { tripSummaryTool } from '../trip-summary';

const toolCall = (name: string, args: object) => ({
  name,
  args,
  id: `call-${name}`,
  type: 'tool_call' as const,
});

const artifactOf = <T>(result: unknown): T => {
  if (typeof result === 'object' && result !== null && 'artifact' in result) {
    return result.artifact as T;
  }

  throw new Error('Expected a ToolMessage with an artifact');
};

const input = { destination: 'Da Nang', flightOrigin: 'HAN' };

afterEach(() => {
  vi.clearAllMocks();
});

describe('tripSummaryTool', () => {
  it('returns the trip summary result as the tool artifact on success', async () => {
    const tripSummaryResult = {
      destination: 'Da Nang',
      flight: { id: 'FL1', price: 120 },
      hotel: { id: 'hotel-1', price_per_night: 90 },
      route: { city: 'Da Nang', stops: [] },
    };
    getTripSummaryMock.mockResolvedValueOnce(tripSummaryResult);

    const result = artifactOf(await tripSummaryTool.invoke(toolCall(tripSummaryTool.name, input)));

    expect(getTripSummaryMock).toHaveBeenCalledWith(input);
    expect(result).toEqual(tripSummaryResult);
  });

  it('returns an error artifact when getTripSummary throws an Error', async () => {
    getTripSummaryMock.mockRejectedValueOnce(new Error('no flights found'));

    const result = artifactOf(await tripSummaryTool.invoke(toolCall(tripSummaryTool.name, input)));

    expect(result).toEqual({ error: 'no flights found' });
  });

  it('falls back to the generic trip summary error message for a non-Error throw', async () => {
    getTripSummaryMock.mockRejectedValueOnce('boom');

    const result = artifactOf(await tripSummaryTool.invoke(toolCall(tripSummaryTool.name, input)));

    expect(result).toEqual({
      error: 'Trip summary failed. Try asking me to search flights and hotels separately.',
    });
  });
});
