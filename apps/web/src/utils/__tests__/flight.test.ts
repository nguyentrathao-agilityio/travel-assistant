import { getAirlineIconClass, computeBadges } from '@/utils/flight';
import type { Flight } from '@repo/types';

const makeFlight = (overrides: Partial<Flight> = {}): Flight => ({
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

describe('getAirlineIconClass', () => {
  it('returns a non-empty string', () => {
    expect(getAirlineIconClass('VN').length).toBeGreaterThan(0);
  });

  it('returns the same class for the same code', () => {
    expect(getAirlineIconClass('VN')).toBe(getAirlineIconClass('VN'));
  });

  it('returns different classes for different codes', () => {
    const codes = ['AA', 'VN', 'QR', 'SQ', 'EK'];
    const classes = codes.map(getAirlineIconClass);
    const uniqueClasses = new Set(classes);
    expect(uniqueClasses.size).toBeGreaterThan(1);
  });

  it('contains Tailwind bg- class', () => {
    expect(getAirlineIconClass('VN')).toContain('bg-');
  });
});

describe('computeBadges', () => {
  it('returns empty map for fewer than 2 flights', () => {
    expect(computeBadges([makeFlight()])).toEqual(new Map());
    expect(computeBadges([])).toEqual(new Map());
    expect(computeBadges(undefined)).toEqual(new Map());
  });

  it('assigns cheapest badge to the lowest-price flight', () => {
    const flights = [makeFlight({ id: 'f1', price: 300 }), makeFlight({ id: 'f2', price: 100 })];
    const badges = computeBadges(flights);
    expect(badges.get('f2')?.label).toBe('Cheapest');
  });

  it('assigns fastest badge to the shortest-duration flight when different from cheapest', () => {
    const flights = [
      makeFlight({ id: 'f1', price: 100, durationMinutes: 200 }),
      makeFlight({ id: 'f2', price: 200, durationMinutes: 90 }),
    ];
    const badges = computeBadges(flights);
    expect(badges.get('f1')?.label).toBe('Cheapest');
    expect(badges.get('f2')?.label).toBe('Fastest');
  });

  it('does not assign fastest badge separately when same flight is cheapest and fastest', () => {
    const flights = [
      makeFlight({ id: 'f1', price: 100, durationMinutes: 90 }),
      makeFlight({ id: 'f2', price: 200, durationMinutes: 200 }),
    ];
    const badges = computeBadges(flights);
    expect(badges.get('f1')?.label).toBe('Cheapest');
    expect(badges.has('f2')).toBe(false);
  });

  it('assigns most popular badge to the first untagged flight when 3+ flights exist', () => {
    const flights = [
      makeFlight({ id: 'f1', price: 100, durationMinutes: 90 }),
      makeFlight({ id: 'f2', price: 200, durationMinutes: 200 }),
      makeFlight({ id: 'f3', price: 300, durationMinutes: 300 }),
    ];
    const badges = computeBadges(flights);
    expect(badges.get('f2')?.label).toBe('Most popular');
  });
});
