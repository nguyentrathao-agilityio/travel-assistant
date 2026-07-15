import { computeHotelBadges } from '@/utils/hotel';
import type { HotelAvailability } from '@repo/types';

const makeHotel = (overrides: Partial<HotelAvailability> = {}): HotelAvailability => ({
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
  nights: 3,
  totalPrice: 300,
  ...overrides,
});

describe('computeHotelBadges', () => {
  it('returns empty map for fewer than 2 hotels', () => {
    expect(computeHotelBadges([makeHotel()])).toEqual(new Map());
    expect(computeHotelBadges([])).toEqual(new Map());
  });

  it('assigns cheapest badge to the lowest-price hotel', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 200 }),
      makeHotel({ id: 'h2', pricePerNight: 80 }),
    ];
    const badges = computeHotelBadges(hotels);
    expect(badges.get('h2')?.label).toBe('Cheapest');
  });

  it('assigns best rated badge to the highest-rated hotel when different from cheapest', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 80, rating: 3.5 }),
      makeHotel({ id: 'h2', pricePerNight: 150, rating: 4.8 }),
    ];
    const badges = computeHotelBadges(hotels);
    expect(badges.get('h1')?.label).toBe('Cheapest');
    expect(badges.get('h2')?.label).toBe('Best rated');
  });

  it('does not assign best rated separately when same hotel is cheapest and best rated', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 80, rating: 4.8 }),
      makeHotel({ id: 'h2', pricePerNight: 150, rating: 3.5 }),
    ];
    const badges = computeHotelBadges(hotels);
    expect(badges.get('h1')?.label).toBe('Cheapest');
    expect(badges.has('h2')).toBe(false);
  });

  it('assigns best value badge to the first untagged hotel when 3+ hotels exist', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 80, rating: 3.5 }),
      makeHotel({ id: 'h2', pricePerNight: 150, rating: 4.8 }),
      makeHotel({ id: 'h3', pricePerNight: 120, rating: 4.0 }),
    ];
    const badges = computeHotelBadges(hotels);
    expect(badges.get('h3')?.label).toBe('Best value');
  });
});
