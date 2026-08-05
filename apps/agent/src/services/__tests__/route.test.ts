import { afterEach, describe, expect, it, vi } from 'vitest';

import { getRoute } from '@/services/route';

const place = (id: string, name: string) => ({
  id,
  name,
  city: 'Da Nang',
  category: 'attraction',
  description: `${name} description`,
  opening_hours: '08:00-18:00',
  price_level: 1,
  latitude: 16.0,
  longitude: 108.2,
});

const routeLeg = {
  straight_line_km: 2.5,
  recommended_mode: 'car',
  legs: [{ mode: 'car', distance_km: 2.5, duration_minutes: 10 }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getRoute', () => {
  it('builds an itinerary with stops and legs between consecutive places', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ results: [place('p1', 'A'), place('p2', 'B')] }))
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(routeLeg)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getRoute({ city: 'Da Nang', maxStops: 2 });

    expect(result.city).toBe('Da Nang');
    expect(result.stops).toHaveLength(2);
    expect(result.stops[0]).toMatchObject({ name: 'A', visitDurationMin: 60 });
    expect(result.legs).toEqual([{ mode: 'taxi', durationMin: 10, distanceKm: 2.5 }]);
    expect(result.totalDurationMin).toBe(60 + 60 + 10);
  });

  it('skips a leg gracefully when the route-leg lookup fails, without throwing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ results: [place('p1', 'A'), place('p2', 'B')] }))
      )
      .mockResolvedValueOnce(new Response('', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getRoute({ city: 'Da Nang', maxStops: 2 });

    expect(result.stops).toHaveLength(2);
    expect(result.legs).toHaveLength(0);
  });

  it('throws when no places are found for the city', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getRoute({ city: 'Nowhere' })).rejects.toThrow('No places found for Nowhere');
  });

  it('throws when the places API responds with a non-OK status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getRoute({ city: 'Da Nang' })).rejects.toThrow('API error 500');
  });

  it('throws a wrapped error when the places network request itself fails', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getRoute({ city: 'Da Nang' })).rejects.toThrow('Network request failed');
  });
});
