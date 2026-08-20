import { fireEvent, render, screen } from '@testing-library/react';

import { BookingApprovalCard } from '../index';

describe('BookingApprovalCard', () => {
  it('does not expose the raw HITL tool description', () => {
    const rawDescription =
      'Tool execution requires approval Tool: bookHotelTool Args: { "customerName": "Huynh" }';

    render(
      <BookingApprovalCard
        request={{
          type: 'booking_approval',
          approvalId: 'approval-raw',
          draftId: 'approval-raw',
          action: 'create_hotel_booking',
          title: 'Confirm hotel booking',
          description: rawDescription,
          referenceId: 'hotel-1',
          details: { city: 'Hoi An', rooms: 1 },
          allowedDecisions: ['approve', 'edit', 'reject'],
        }}
        onDecision={jest.fn()}
      />
    );

    expect(screen.queryByText(rawDescription)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tool execution requires approval/)).not.toBeInTheDocument();
  });

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

  it('cancels the pending booking', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDecision).toHaveBeenCalledWith('reject');
  });

  it('explains that cancelling does not create the booking', () => {
    render(
      <BookingApprovalCard
        request={{
          type: 'booking_approval',
          approvalId: 'approval-copy',
          action: 'create_flight_booking',
          title: 'Confirm flight booking',
          description: 'Flight One',
          referenceId: 'flight-1',
          details: { adults: 1 },
          allowedDecisions: ['approve', 'reject'],
        }}
        onDecision={jest.fn()}
      />
    );

    expect(
      screen.getByText('Choose Cancel to stop without creating this booking.')
    ).toBeInTheDocument();
  });

  it('explains that keeping a booking rejects cancellation', () => {
    render(
      <BookingApprovalCard
        request={{
          type: 'booking_approval',
          approvalId: 'approval-cancel-copy',
          action: 'cancel_booking',
          title: 'Confirm booking cancellation',
          description: 'Cancel ABC123',
          referenceId: 'ABC123',
          details: { bookingId: 'ABC123' },
          allowedDecisions: ['approve', 'reject'],
        }}
        onDecision={jest.fn()}
      />
    );

    expect(
      screen.getByText(
        'Choose Keep booking to reject this cancellation and leave the booking active.'
      )
    ).toBeInTheDocument();
  });
});
