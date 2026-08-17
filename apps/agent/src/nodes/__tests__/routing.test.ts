import { describe, expect, it } from 'vitest';

import { routeAfterPlanning, routeByIntent } from '@/nodes/routing';
import type { GraphStateType } from '@/state';

describe('routeByIntent', () => {
  it.each([
    ['explore', 'explore'],
    ['plan', 'plan'],
    ['book_flight', 'booking'],
    ['book_hotel', 'booking'],
    ['cancel_booking', 'booking'],
    ['general', 'general'],
    ['out_of_scope', 'refusal'],
  ] as const)('routes intent "%s" to branch "%s"', (intent, branch) => {
    expect(routeByIntent(intent)).toBe(branch);
  });

  it('falls back to the general branch when intent is missing', () => {
    expect(routeByIntent(undefined)).toBe('general');
  });
});

describe('routeAfterPlanning', () => {
  it.each([
    ['booking', 'booking'],
    [undefined, 'saveMemory'],
  ] as const)('routes handoff target %s to %s', (handoffTarget, expected) => {
    const state = { handoffTarget } as GraphStateType;

    expect(routeAfterPlanning(state)).toBe(expected);
  });
});
