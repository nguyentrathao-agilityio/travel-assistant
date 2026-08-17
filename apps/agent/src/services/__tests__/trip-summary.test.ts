import { afterEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();

vi.mock('@/infrastructure/llm', () => ({
  getOpenAIClient: () => ({ responses: { create: createMock } }),
  OPENAI_CLIENT_MODEL: 'gpt-4o-mini',
}));

const searchFlightsMock = vi.fn();
const searchHotelsMock = vi.fn();
const getRouteMock = vi.fn();

vi.mock('@/services/flights', () => ({
  searchFlights: (...args: unknown[]) => searchFlightsMock(...args),
}));
vi.mock('@/services/hotel', () => ({
  searchHotels: (...args: unknown[]) => searchHotelsMock(...args),
}));
vi.mock('@/services/route', () => ({ getRoute: (...args: unknown[]) => getRouteMock(...args) }));

import { getTripSummary } from '@/services/trip-summary';

const flight = {
  id: 'FL1',
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flightNumber: 'VN101',
  origin: 'HAN',
  destination: 'DAD',
  departureTime: '2026-08-10T08:00:00+07:00',
  arrivalTime: '2026-08-10T09:25:00+07:00',
  durationMinutes: 85,
  price: 60,
  currency: 'USD',
  seatsAvailable: 4,
  stops: 0,
};

const hotel = {
  id: 'hotel-1',
  shortCode: 'HTL-ONE',
  code: 'ONE',
  name: 'Hotel One',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '1 Beach Road',
  starRating: 4,
  pricePerNight: 90,
  currency: 'USD',
  amenities: ['wifi'],
  rating: 4.5,
  reviewCount: 100,
  imageUrl: 'https://example.com/hotel.jpg',
  available: true,
  availableRooms: 3,
  maxOccupancyPerRoom: 2,
  nights: 2,
  totalPrice: 180,
};

const route = { city: 'Da Nang', totalDurationMin: 240, stops: [], legs: [] };

afterEach(() => {
  vi.clearAllMocks();
});

describe('getTripSummary', () => {
  it('picks the cheapest flight and the highest-rated available hotel', async () => {
    searchFlightsMock.mockResolvedValueOnce({ count: 1, results: [flight] });
    searchHotelsMock.mockResolvedValueOnce({
      total: 1,
      limit: 20,
      offset: 0,
      results: [hotel],
      search: {
        city: 'Da Nang',
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        nights: 2,
        rooms: 1,
      },
    });
    getRouteMock.mockResolvedValueOnce(route);
    createMock.mockResolvedValueOnce({
      output_text: JSON.stringify({ food: 20, activities: 15, transport: 5 }),
    });

    const result = await getTripSummary({
      destination: 'Da Nang',
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      travelers: 2,
      flightOrigin: 'HAN',
    });

    expect(result.suggestedFlight?.id).toBe('FL1');
    expect(result.suggestedHotel?.id).toBe('hotel-1');
    expect(result.days).toBe(2);
    expect(result.costEstimate.flightTotal).toBe(120);
    expect(result.costEstimate.hotelTotal).toBe(180);
  });

  it('skips flight search when skipFlights is set, leaving suggestedFlight null', async () => {
    searchHotelsMock.mockResolvedValueOnce({
      total: 1,
      limit: 20,
      offset: 0,
      results: [hotel],
      search: {
        city: 'Da Nang',
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        nights: 2,
        rooms: 1,
      },
    });
    getRouteMock.mockResolvedValueOnce(route);
    createMock.mockResolvedValueOnce({
      output_text: JSON.stringify({ food: 20, activities: 15, transport: 5 }),
    });

    const result = await getTripSummary({
      destination: 'Da Nang',
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      skipFlights: true,
    });

    expect(searchFlightsMock).not.toHaveBeenCalled();
    expect(result.suggestedFlight).toBeNull();
  });

  it('falls back to fixed daily rates when the cost-estimate LLM call fails', async () => {
    searchHotelsMock.mockResolvedValueOnce({
      total: 0,
      limit: 20,
      offset: 0,
      results: [],
      search: {
        city: 'Da Nang',
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        nights: 2,
        rooms: 1,
      },
    });
    getRouteMock.mockResolvedValueOnce(route);
    createMock.mockRejectedValueOnce(new Error('openai down'));

    const result = await getTripSummary({
      destination: 'Da Nang',
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      skipFlights: true,
    });

    expect(result.costEstimate.foodTotal).toBe(35 * 2);
  });

  it('throws when endDate is before startDate', async () => {
    await expect(
      getTripSummary({ destination: 'Da Nang', startDate: '2026-08-12', endDate: '2026-08-10' })
    ).rejects.toThrow('must be after');
  });
});
