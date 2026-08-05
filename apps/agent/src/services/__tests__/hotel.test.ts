import { afterEach, describe, expect, it, vi } from 'vitest';

import { searchHotels } from '@/services/hotel';

const apiHotel = {
  id: 'hotel-1',
  short_code: 'HTL-ONE',
  code: 'ONE',
  name: 'Hotel One',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '1 Beach Road',
  star_rating: 4,
  price_per_night: 90,
  currency: 'USD',
  amenities: ['wifi'],
  rating: 4.5,
  review_count: 100,
  image_url: 'https://example.com/hotel.jpg',
  available: true,
  available_rooms: 3,
  max_occupancy_per_room: 2,
  nights: 2,
  total_price: 180,
};

const apiResponse = {
  total: 1,
  limit: 20,
  offset: 0,
  results: [apiHotel],
  search: {
    city: 'Da Nang',
    check_in: '2026-08-10',
    check_out: '2026-08-12',
    nights: 2,
    rooms: 1,
    adults: 2,
    children: 0,
  },
};

const input = { city: 'Da Nang', checkIn: '2026-08-10', checkOut: '2026-08-12' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchHotels', () => {
  it('maps a valid API response to camelCase results', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(apiResponse)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await searchHotels(input);

    expect(result.total).toBe(1);
    expect(result.results[0]).toMatchObject({
      id: 'hotel-1',
      shortCode: 'HTL-ONE',
      name: 'Hotel One',
      starRating: 4,
      pricePerNight: 90,
      totalPrice: 180,
    });
    expect(result.search).toEqual({
      city: 'Da Nang',
      checkIn: '2026-08-10',
      checkOut: '2026-08-12',
      nights: 2,
      rooms: 1,
      adults: 2,
      children: 0,
    });
  });

  it('throws when the API responds with a non-OK status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchHotels(input)).rejects.toThrow('Hotel API failed: 500');
  });

  it('throws when the API response does not match the expected shape', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ oops: true })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchHotels(input)).rejects.toThrow('Invalid hotel response shape');
  });

  it('throws a wrapped error when the network request itself fails', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchHotels(input)).rejects.toThrow('Failed to search hotels: network down');
  });
});
