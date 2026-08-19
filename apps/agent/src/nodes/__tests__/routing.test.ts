import { describe, expect, it } from 'vitest';

// Nodes
import { routeByIntent } from '@/nodes/classify';

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
