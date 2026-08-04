import { afterEach, describe, expect, it, vi } from 'vitest';

const getPlacesMock = vi.fn();

vi.mock('../../services/places', () => ({
  getPlaces: (...args: unknown[]) => getPlacesMock(...args),
}));

import { placesTool } from '../places';

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

const input = {
  city: 'Hanoi',
  category: 'restaurant' as const,
  price_level: 2,
  recommended: true,
  sort: 'rating_desc' as const,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('placesTool', () => {
  it('returns the places result as the tool artifact on success', async () => {
    const placesResult = {
      results: [{ id: 'p1', name: 'Cha Ca La Vong', city: 'Hanoi', category: 'restaurant' }],
    };
    getPlacesMock.mockResolvedValueOnce(placesResult);

    const result = artifactOf(await placesTool.invoke(toolCall(placesTool.name, input)));

    expect(getPlacesMock).toHaveBeenCalledWith(input);
    expect(result).toEqual(placesResult);
  });

  it('returns an error artifact when getPlaces throws an Error', async () => {
    getPlacesMock.mockRejectedValueOnce(new Error('provider unavailable'));

    const result = artifactOf(await placesTool.invoke(toolCall(placesTool.name, input)));

    expect(result).toEqual({ error: 'provider unavailable' });
  });

  it('falls back to the generic places error message for a non-Error throw', async () => {
    getPlacesMock.mockRejectedValueOnce('boom');

    const result = artifactOf(await placesTool.invoke(toolCall(placesTool.name, input)));

    expect(result).toEqual({
      error: "Couldn't load places for that destination. Please try again.",
    });
  });
});
