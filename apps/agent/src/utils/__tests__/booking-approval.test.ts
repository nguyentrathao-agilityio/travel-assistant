import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BookingApprovalRequest } from '@repo/types';

const { interruptMock } = vi.hoisted(() => ({ interruptMock: vi.fn() }));
vi.mock('@langchain/langgraph', () => ({
  interrupt: interruptMock,
}));

import {
  bookingToolError,
  formatBookingToolResult,
  requestBookingApproval,
  withApprovalId,
} from '@/utils/booking-approval';

const baseRequest: Omit<BookingApprovalRequest, 'approvalId' | 'draftId'> = {
  type: 'booking_approval',
  action: 'create_flight_booking',
  title: 'Confirm flight booking',
  description: 'VN101 DAD -> SGN',
  referenceId: 'FL1',
  details: { flight: 'VN101' },
  totalPrice: 120,
  currency: 'USD',
  allowedDecisions: ['approve', 'reject'],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('withApprovalId', () => {
  it('derives the same approvalId for the same request payload', () => {
    expect(withApprovalId(baseRequest).approvalId).toBe(withApprovalId(baseRequest).approvalId);
  });

  it('derives a different approvalId for a different request payload', () => {
    const other = { ...baseRequest, totalPrice: 150 };

    expect(withApprovalId(baseRequest).approvalId).not.toBe(withApprovalId(other).approvalId);
  });

  it('preserves all original request fields alongside the derived approvalId', () => {
    const withId = withApprovalId(baseRequest);

    expect(withId).toEqual({
      ...baseRequest,
      approvalId: withId.approvalId,
      draftId: withId.approvalId,
    });
    expect(withId.approvalId.length).toBeGreaterThan(0);
  });
});

describe('requestBookingApproval', () => {
  const request = withApprovalId(baseRequest);

  it('returns true when the response approves the current approvalId', () => {
    interruptMock.mockReturnValueOnce({ decision: 'approve', approvalId: request.approvalId });

    expect(requestBookingApproval(request).decision).toBe('approve');
    expect(interruptMock).toHaveBeenCalledTimes(1);
    expect(interruptMock).toHaveBeenCalledWith(request);
  });

  it('returns false when the response rejects', () => {
    interruptMock.mockReturnValueOnce({ decision: 'reject', approvalId: request.approvalId });

    expect(requestBookingApproval(request).decision).toBe('reject');
  });

  it('re-requests approval when the first response references a stale approvalId, then approves', () => {
    interruptMock
      .mockReturnValueOnce({ decision: 'approve', approvalId: 'stale-quote' })
      .mockReturnValueOnce({ decision: 'approve', approvalId: request.approvalId });

    expect(requestBookingApproval(request).decision).toBe('approve');
    expect(interruptMock).toHaveBeenCalledTimes(2);
  });

  it('returns false when a re-requested approval is rejected', () => {
    interruptMock
      .mockReturnValueOnce({ decision: 'approve', approvalId: 'stale-quote' })
      .mockReturnValueOnce({ decision: 'reject', approvalId: 'stale-quote' });

    expect(requestBookingApproval(request).decision).toBe('reject');
    expect(interruptMock).toHaveBeenCalledTimes(2);
  });

  it('throws when a plain, non-JSON string response is missing the required approvalId', () => {
    // Non-JSON input lacks the required approval ID and fails validation.
    interruptMock.mockReturnValueOnce('reject');

    expect(() => requestBookingApproval(request)).toThrow();
  });

  it('parses a JSON-string interrupt response before validating it', () => {
    interruptMock.mockReturnValueOnce(
      JSON.stringify({ decision: 'approve', approvalId: request.approvalId })
    );

    expect(requestBookingApproval(request).decision).toBe('approve');
  });

  it('validates and returns an edit resume command without approving the write', () => {
    interruptMock.mockReturnValueOnce({
      decision: 'edit',
      approvalId: request.approvalId,
      edits: { adults: 2 },
    });

    expect(requestBookingApproval(request)).toEqual({
      decision: 'edit',
      approvalId: request.approvalId,
      edits: { adults: 2 },
    });
  });
});

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
