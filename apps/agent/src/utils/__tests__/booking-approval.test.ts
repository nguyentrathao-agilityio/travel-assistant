import { describe, expect, it } from 'vitest';

// Utils
import {
  bookingToolError,
  formatBookingToolFailure,
  formatBookingToolResult,
} from '@/utils/booking-approval';

describe('bookingToolError', () => {
  it('uses the Error message when the caught value is an Error', () => {
    expect(bookingToolError(new Error('seats no longer available'), 'fallback')).toEqual(
      expect.objectContaining({
        error: 'seats no longer available',
        retryable: false,
      })
    );
  });

  it('falls back to the provided message for a non-Error throw', () => {
    expect(bookingToolError('boom', 'fallback message')).toEqual(
      expect.objectContaining({ error: 'fallback message' })
    );
  });
});

describe('formatBookingToolResult', () => {
  it('returns a [stringified content, artifact] tuple', () => {
    const booking = { id: 'booking-1', status: 'confirmed' };

    expect(formatBookingToolResult(booking)).toEqual([JSON.stringify(booking), booking]);
  });
});

describe('formatBookingToolFailure', () => {
  it('normalizes a caught booking error directly into a content-and-artifact tuple', () => {
    const [content, artifact] = formatBookingToolFailure(
      new Error('provider timeout'),
      'fallback message'
    );

    expect(JSON.parse(content)).toEqual(artifact);
    expect(artifact).toEqual(
      expect.objectContaining({ error: 'provider timeout', retryable: false })
    );
  });
});
