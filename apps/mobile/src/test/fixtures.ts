import type { HotelAvailability as SchemaHotelAvailability } from '@repo/schemas';
import type { Flight, HotelAvailability, Place } from '@repo/types';
import type { ThreadItem } from '../services/threadHistory';

export const makeFlight = (overrides: Partial<Flight> = {}): Flight => ({
  id: 'f1',
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flightNumber: 'VN100',
  origin: 'HAN',
  destination: 'SGN',
  departureTime: '2026-07-01T08:00:00Z',
  arrivalTime: '2026-07-01T10:00:00Z',
  durationMinutes: 120,
  price: 200,
  currency: 'USD',
  seatsAvailable: 10,
  stops: 0,
  ...overrides,
});

export const makeHotel = (overrides: Partial<HotelAvailability> = {}): HotelAvailability => ({
  id: 'h1',
  shortCode: 'TST',
  name: 'Test Hotel',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '123 Beach Rd',
  starRating: 4,
  pricePerNight: 100,
  currency: 'USD',
  amenities: ['wifi'],
  rating: 4.0,
  reviewCount: 100,
  imageUrl: 'https://example.com/img.jpg',
  available: true,
  availableRooms: 5,
  maxOccupancyPerRoom: 2,
  nights: 2,
  totalPrice: 200,
  ...overrides,
});

// `@repo/schemas`'s HotelAvailability structurally extends `@repo/types`'s with a `code`
// field — a real drift between the two packages, not a naming accident. Components that
// render tool-call results (typed against the schemas package) need this variant.
export const makeSchemaHotel = (
  overrides: Partial<SchemaHotelAvailability> = {}
): SchemaHotelAvailability => {
  const base = makeHotel();

  return { ...base, code: 'TST', imageUrl: base.imageUrl ?? '', ...overrides };
};

export const makeThread = (
  id: string,
  title: string | null,
  overrides: Partial<Pick<ThreadItem, 'createdAt'>> = {}
): ThreadItem => ({
  createdAt: '2026-09-01T00:00:00Z',
  id,
  title,
  ...overrides,
});

export const makePlace = (id: string, name: string): Place => ({
  id,
  shortCode: id.toUpperCase(),
  name,
  city: 'Da Nang',
  country: 'Vietnam',
  category: 'attraction',
  description: `${name} description`,
  address: '1 Main St',
  rating: 4.5,
  reviewCount: 100,
  priceLevel: 1,
  imageUrl: '',
  tags: [],
  isRecommended: true,
});

export const SAFE_AREA_INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
