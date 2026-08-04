import { describe, expect, it } from 'vitest';

import { routeAfterPlanning, routeByIntent } from '../routing';
import type { GraphStateType } from '../../state';

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

describe('routeAfterPlanning', () => {
  it.each([
    ['bookFlight', 'bookFlight'],
    ['bookHotel', 'bookHotel'],
    [undefined, 'saveMemory'],
  ] as const)('routes handoff target %s to %s', (handoffTarget, expected) => {
    const state = { handoffTarget } as GraphStateType;

    expect(routeAfterPlanning(state)).toBe(expected);
  });
});
