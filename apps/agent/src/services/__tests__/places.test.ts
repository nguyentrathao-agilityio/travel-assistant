import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPlaces } from '../places';

const apiPlace = {
  id: 'p1',
  short_code: 'DAD-01',
  name: 'Dragon Bridge',
  city: 'Da Nang',
  country: 'Vietnam',
  category: 'attraction',
  description: 'Iconic bridge that breathes fire on weekends.',
  address: 'Bach Dang St',
  rating: 4.6,
  review_count: 5000,
  price_level: 1,
  opening_hours: '24 hours',
  image_url: 'https://example.com/bridge.jpg',
  tags: ['landmark'],
  is_recommended: true,
  latitude: 16.06,
  longitude: 108.22,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getPlaces', () => {
  it('maps a valid API response to camelCase results', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ total: 1, results: [apiPlace], city: 'Da Nang' }))
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getPlaces({ city: 'Da Nang' });

    expect(result.total).toBe(1);
    expect(result.results[0]).toMatchObject({
      id: 'p1',
      shortCode: 'DAD-01',
      name: 'Dragon Bridge',
      isRecommended: true,
    });
  });

  it('throws a wrapped error when the network request itself fails', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPlaces({ city: 'Da Nang' })).rejects.toThrow('Network request failed');
  });

  it('throws when the API responds with a non-OK status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 404, statusText: 'Not Found' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPlaces({ city: 'Nowhere' })).rejects.toThrow('API error 404');
  });

  it('throws when the API response does not match the expected shape', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ oops: true })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPlaces({ city: 'Da Nang' })).rejects.toThrow('Invalid response from');
  });
});
