import { fireEvent, render, screen } from '@testing-library/react';

import { BookingApprovalCard } from '../index';

describe('BookingApprovalCard', () => {
  it('requires an explicit decision and prevents double submit', () => {
    const onDecision = jest.fn();
    render(
      <BookingApprovalCard
        request={{
          type: 'booking_approval',
          approvalId: 'approval-1',
          draftId: 'approval-1',
          action: 'create_flight_booking',
          title: 'Confirm flight booking',
          description: 'VN101 · DAD → SGN',
          referenceId: 'flight-1',
          details: { passenger: 'Nguyen Van A' },
          totalPrice: 120,
          currency: 'USD',
          allowedDecisions: ['approve', 'edit', 'reject'],
        }}
        onDecision={onDecision}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking ↗' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submitting…' }));

    expect(onDecision).toHaveBeenCalledTimes(1);
    expect(onDecision).toHaveBeenCalledWith('approve');
  });

  it('submits edit rather than disguising it as rejection', () => {
    const onDecision = jest.fn();
    render(
      <BookingApprovalCard
        request={{
          type: 'booking_approval',
          approvalId: 'approval-1',
          draftId: 'approval-1',
          action: 'create_hotel_booking',
          title: 'Confirm hotel booking',
          description: 'Hotel One',
          referenceId: 'hotel-1',
          details: { rooms: 1 },
          allowedDecisions: ['approve', 'edit', 'reject'],
        }}
        onDecision={onDecision}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onDecision).toHaveBeenCalledWith('edit');
  });
});
