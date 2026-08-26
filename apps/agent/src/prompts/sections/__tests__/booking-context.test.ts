import { describe, expect, it } from 'vitest';

import { buildBookingContext } from '@/prompts/sections/booking-context';
import type { GraphStateType } from '@/state';

describe('buildBookingContext', () => {
  it('includes a confirmed flight booking so the agent can prevent a duplicate booking', () => {
    const context = buildBookingContext({
      flightBooking: {
        id: 'booking-flight-1',
        confirmationCode: 'TRIP-FLIGHT-1',
        type: 'flight',
        referenceId: 'flight-1',
        customerName: 'Nguyen Van A',
        customerEmail: 'a@example.com',
        totalPrice: 100,
        currency: 'USD',
        status: 'confirmed',
        createdAt: '2026-08-05T10:00:00Z',
        summary: 'HAN to DAD',
      },
    } as GraphStateType);

    expect(context).toContain('flightBooking:');
    expect(context).toContain('status: confirmed');
    expect(context).toContain('confirmationCode: TRIP-FLIGHT-1');
  });
});
