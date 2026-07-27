import { describe, expect, it } from 'vitest';

import { routeByIntent } from '../routing';

describe('routeByIntent', () => {
  it.each([
    ['explore', 'explore'],
    ['plan', 'plan'],
    ['book_flight', 'bookFlight'],
    ['book_hotel', 'bookHotel'],
    ['cancel_booking', 'cancelBooking'],
    ['general', 'general'],
  ] as const)('routes intent "%s" to branch "%s"', (intent, branch) => {
    expect(routeByIntent(intent)).toBe(branch);
  });

  it('falls back to the general branch when intent is missing', () => {
    expect(routeByIntent(undefined)).toBe('general');
  });
});
