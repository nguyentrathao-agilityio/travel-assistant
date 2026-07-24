import { afterEach, describe, expect, it, vi } from 'vitest';

import { bookFlight, bookHotel } from '../booking';

const flight = {
  id: 'FL_DAD_SGN_20260730_01',
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

const booking = {
  id: 'booking-1',
  confirmation_code: 'TRIP-123',
  type: 'flight',
  reference_id: flight.id,
  customer_name: 'Nguyen Van A',
  customer_email: 'a@example.com',
  total_price: 120,
  currency: 'USD',
  status: 'confirmed',
  created_at: '2026-07-23T10:00:00Z',
  details: {},
  notes: null,
  summary: 'DAD to SGN',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('booking service', () => {
  it('revalidates a flight and sends a stable idempotency key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(flight), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(booking), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const input = {
      flightId: flight.id,
      adults: 1,
      customerName: 'Nguyen Van A',
      customerEmail: 'a@example.com',
      customerPhone: '+84901234567',
    };

    await bookFlight(input);
    const firstRequest = fetchMock.mock.calls[1][1] as RequestInit;
    const firstKey = (firstRequest.headers as Record<string, string>)['Idempotency-Key'];

    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(flight), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(booking), { status: 201 }));
    await bookFlight(input);
    const secondRequest = fetchMock.mock.calls[3][1] as RequestInit;
    const secondKey = (secondRequest.headers as Record<string, string>)['Idempotency-Key'];

    expect(firstKey).toHaveLength(64);
    expect(secondKey).toBe(firstKey);
  });

  it('does not create a hotel booking when the selected hotel is unavailable', async () => {
    const availability = {
      total: 1,
      limit: 20,
      offset: 0,
      results: [
        {
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
          available: false,
          available_rooms: 0,
          max_occupancy_per_room: 2,
          nights: 2,
          total_price: 180,
        },
      ],
      search: {
        city: 'Da Nang',
        check_in: '2026-08-01',
        check_out: '2026-08-03',
        nights: 2,
        rooms: 1,
        adults: 2,
        children: 0,
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(availability), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      bookHotel({
        hotelId: 'hotel-1',
        city: 'Da Nang',
        checkIn: '2026-08-01',
        checkOut: '2026-08-03',
        rooms: 1,
        adults: 2,
        children: 0,
        customerName: 'Nguyen Van A',
        customerEmail: 'a@example.com',
        customerPhone: '+84901234567',
      })
    ).rejects.toThrow('no longer available');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
