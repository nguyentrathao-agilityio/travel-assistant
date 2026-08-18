import { afterEach, describe, expect, it, vi } from 'vitest';

// Services
import { searchFlights } from '@/services/flights';

const apiFlight = {
  id: 'FL1',
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flight_number: 'VN101',
  origin: 'DAD',
  destination: 'SGN',
  departure_time: '2026-07-30T08:00:00+07:00',
  arrival_time: '2026-07-30T09:25:00+07:00',
  duration_minutes: 85,
  price: 120,
  currency: 'USD',
  seats_available: 4,
  stops: 0,
};

const input = { origin: 'DAD', destination: 'SGN', departure_date: '2026-07-30', adults: 1 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchFlights', () => {
  it('maps a valid API response to camelCase results', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ count: 1, results: [apiFlight] })));

    vi.stubGlobal('fetch', fetchMock);

    const result = await searchFlights(input);

    expect(result.count).toBe(1);
    expect(result.results[0]).toEqual({
      id: 'FL1',
      airline: { code: 'VN', name: 'Vietnam Airlines' },
      flightNumber: 'VN101',
      origin: 'DAD',
      destination: 'SGN',
      departureTime: '2026-07-30T08:00:00+07:00',
      arrivalTime: '2026-07-30T09:25:00+07:00',
      durationMinutes: 85,
      price: 120,
      currency: 'USD',
      seatsAvailable: 4,
      stops: 0,
    });
  });

  it('includes mapped round-trip results when the API returns them', async () => {
    const returnFlight = { ...apiFlight, id: 'FL2', origin: 'SGN', destination: 'DAD' };
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          count: 1,
          results: [apiFlight],
          return_count: 1,
          return_results: [returnFlight],
        })
      )
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await searchFlights({ ...input, return_date: '2026-08-02' });

    expect(result.returnCount).toBe(1);
    expect(result.returnResults?.[0].id).toBe('FL2');
  });

  it('throws when the API responds with a non-OK status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }));

    vi.stubGlobal('fetch', fetchMock);

    await expect(searchFlights(input)).rejects.toThrow('Flight search failed: 500');
  });

  it('throws when the API response does not match the expected shape', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ oops: true })));

    vi.stubGlobal('fetch', fetchMock);

    await expect(searchFlights(input)).rejects.toThrow('Invalid flight search response shape');
  });
});
