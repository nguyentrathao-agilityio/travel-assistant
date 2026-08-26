import { fireEvent, render, screen } from '@testing-library/react';
import type { BookingApprovalRequest } from '@repo/types';

import { BookingApprovalCard } from '../index';

const hotelRequest: BookingApprovalRequest = {
  type: 'booking_approval',
  approvalId: 'approval-1',
  draftId: 'approval-1',
  action: 'create_hotel_booking',
  title: 'Confirm hotel booking',
  description: 'Tool execution requires approval',
  referenceId: 'hotel-1',
  details: { rooms: 1, customerName: 'Thao' },
  allowedDecisions: ['approve', 'edit', 'reject'],
};

describe('BookingApprovalCard', () => {
  it('does not expose the raw HITL tool description', () => {
    render(<BookingApprovalCard request={hotelRequest} onDecision={jest.fn()} />);
    expect(screen.queryByText(hotelRequest.description)).not.toBeInTheDocument();
  });

  it('requires an explicit decision and prevents double submit', () => {
    const onDecision = jest.fn();
    render(<BookingApprovalCard request={hotelRequest} onDecision={onDecision} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking ↗' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submitting…' }));

    expect(onDecision).toHaveBeenCalledTimes(1);
    expect(onDecision).toHaveBeenCalledWith('approve', undefined);
  });

  it('saves edited fields for review and submits them only after confirmation', () => {
    const onDecision = jest.fn();
    render(<BookingApprovalCard request={hotelRequest} onDecision={onDecision} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('rooms'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onDecision).not.toHaveBeenCalled();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Review the updated details/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking ↗' }));
    expect(onDecision).toHaveBeenCalledWith('edit', { rooms: 2, customerName: 'Thao' });
  });

  it('cancels the pending booking', () => {
    const onDecision = jest.fn();
    render(<BookingApprovalCard request={hotelRequest} onDecision={onDecision} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDecision).toHaveBeenCalledWith('reject');
  });

  it('does not allow editing the flightId/hotelId reference field', () => {
    const flightRequest: BookingApprovalRequest = {
      ...hotelRequest,
      action: 'create_flight_booking',
      details: { flightId: 'FL1', customerName: 'Thao' },
    };
    render(<BookingApprovalCard request={flightRequest} onDecision={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.queryByLabelText('flightId')).not.toBeInTheDocument();
    expect(screen.getByLabelText('customerName')).toBeInTheDocument();
    expect(screen.getByText('FL1')).toBeInTheDocument();
  });

  it('does not offer edit for cancellation actions', () => {
    render(
      <BookingApprovalCard
        request={{
          ...hotelRequest,
          action: 'cancel_booking',
          title: 'Confirm booking cancellation',
          details: { bookingId: 'ABC123' },
          allowedDecisions: ['approve', 'reject'],
        }}
        onDecision={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep booking' })).toBeInTheDocument();
  });
});
