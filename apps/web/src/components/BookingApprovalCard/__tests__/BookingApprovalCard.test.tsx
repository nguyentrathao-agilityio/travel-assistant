import { fireEvent, render, screen } from '@testing-library/react';

import { BookingApprovalCard } from '../index';

describe('BookingApprovalCard', () => {
  it('requires an explicit decision and prevents double submit', () => {
    const onDecision = jest.fn();
    render(
      <BookingApprovalCard
        request={{
          type: 'booking_approval',
          action: 'create_flight_booking',
          title: 'Confirm flight booking',
          description: 'VN101 · DAD → SGN',
          referenceId: 'flight-1',
          details: { passenger: 'Nguyen Van A' },
          totalPrice: 120,
          currency: 'USD',
          allowedDecisions: ['approve', 'reject'],
        }}
        onDecision={onDecision}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking ↗' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submitting…' }));

    expect(onDecision).toHaveBeenCalledTimes(1);
    expect(onDecision).toHaveBeenCalledWith('approve');
  });
});
