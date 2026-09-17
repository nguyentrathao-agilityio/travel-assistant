import { computeHotelBadges } from '../hotel';
import { makeHotel } from '../../test/fixtures';

describe('computeHotelBadges', () => {
  test('returns an empty map for fewer than 2 hotels', () => {
    expect(computeHotelBadges([makeHotel()])).toEqual(new Map());
    expect(computeHotelBadges([])).toEqual(new Map());
  });

  test('assigns the cheapest badge to the lowest-price hotel', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 200 }),
      makeHotel({ id: 'h2', pricePerNight: 80 }),
    ];
    const badges = computeHotelBadges(hotels);

    expect(badges.get('h2')?.label).toBe('💵 Cheapest');
  });

  test('assigns the best rated badge to the highest-rated hotel when different from cheapest', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 80, rating: 3.5 }),
      makeHotel({ id: 'h2', pricePerNight: 150, rating: 4.8 }),
    ];
    const badges = computeHotelBadges(hotels);

    expect(badges.get('h1')?.label).toBe('💵 Cheapest');
    expect(badges.get('h2')?.label).toBe('⭐ Best rated');
  });

  test('does not assign the best rated badge separately when the cheapest hotel is also best rated', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 80, rating: 4.8 }),
      makeHotel({ id: 'h2', pricePerNight: 150, rating: 3.5 }),
    ];
    const badges = computeHotelBadges(hotels);

    expect(badges.get('h1')?.label).toBe('💵 Cheapest');
    expect(badges.has('h2')).toBe(false);
  });

  test('assigns the best value badge to the first untagged hotel when 3+ hotels exist', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 80, rating: 3.5 }),
      makeHotel({ id: 'h2', pricePerNight: 150, rating: 4.8 }),
      makeHotel({ id: 'h3', pricePerNight: 120, rating: 4.0 }),
    ];
    const badges = computeHotelBadges(hotels);

    expect(badges.get('h3')?.label).toBe('👍 Best value');
  });

  test('does not assign the best value badge with only 2 hotels', () => {
    const hotels = [
      makeHotel({ id: 'h1', pricePerNight: 80, rating: 3.5 }),
      makeHotel({ id: 'h2', pricePerNight: 150, rating: 4.8 }),
    ];

    expect(computeHotelBadges(hotels).size).toBe(2);
  });
});
