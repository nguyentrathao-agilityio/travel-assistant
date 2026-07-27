import { describe, expect, it } from 'vitest';

import { buildGraph } from '../agent';

describe('travel agent graph', () => {
  it('wires classify to all six intent branches and compiles', () => {
    const compiled = buildGraph().compile();
    const nodeNames = Object.keys(compiled.nodes);

    expect(nodeNames).toEqual(
      expect.arrayContaining([
        'classify',
        'explore',
        'plan',
        'bookFlight',
        'bookHotel',
        'cancelBooking',
        'general',
      ])
    );
  });
});
