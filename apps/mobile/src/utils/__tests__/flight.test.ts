import { computeBadges } from '../flight';
import { makeFlight } from '../../test/fixtures';

describe('computeBadges', () => {
  test('returns an empty map for fewer than 2 flights', () => {
    expect(computeBadges([makeFlight()])).toEqual(new Map());
    expect(computeBadges([])).toEqual(new Map());
    expect(computeBadges(undefined)).toEqual(new Map());
  });

  test('assigns the cheapest badge to the lowest-price flight', () => {
    const flights = [makeFlight({ id: 'f1', price: 300 }), makeFlight({ id: 'f2', price: 100 })];
    const badges = computeBadges(flights);

    expect(badges.get('f2')?.label).toBe('💵 Cheapest');
  });

  test('assigns the fastest badge to the shortest-duration flight when different from cheapest', () => {
    const flights = [
      makeFlight({ id: 'f1', price: 100, durationMinutes: 200 }),
      makeFlight({ id: 'f2', price: 200, durationMinutes: 90 }),
    ];
    const badges = computeBadges(flights);

    expect(badges.get('f1')?.label).toBe('💵 Cheapest');
    expect(badges.get('f2')?.label).toBe('⚡ Fastest');
  });

  test('does not assign the fastest badge separately when the cheapest flight is also fastest', () => {
    const flights = [
      makeFlight({ id: 'f1', price: 100, durationMinutes: 90 }),
      makeFlight({ id: 'f2', price: 200, durationMinutes: 200 }),
    ];
    const badges = computeBadges(flights);

    expect(badges.get('f1')?.label).toBe('💵 Cheapest');
    expect(badges.has('f2')).toBe(false);
  });

  test('assigns the most popular badge to the first untagged flight when 3+ flights exist', () => {
    const flights = [
      makeFlight({ id: 'f1', price: 100, durationMinutes: 90 }),
      makeFlight({ id: 'f2', price: 200, durationMinutes: 200 }),
      makeFlight({ id: 'f3', price: 300, durationMinutes: 300 }),
    ];
    const badges = computeBadges(flights);

    expect(badges.get('f2')?.label).toBe('⭐ Most popular');
  });

  test('does not assign the most popular badge with only 2 flights', () => {
    const flights = [
      makeFlight({ id: 'f1', price: 100, durationMinutes: 90 }),
      makeFlight({ id: 'f2', price: 200, durationMinutes: 200 }),
    ];

    expect(computeBadges(flights).size).toBe(1);
  });
});
