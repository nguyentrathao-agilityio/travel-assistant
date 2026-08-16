import type { Meta, StoryObj } from '@storybook/react';

import { BookingApprovalCard } from './index';
import type { BookingApprovalRequest } from '@repo/types';

const meta: Meta<typeof BookingApprovalCard> = {
  title: 'Components/BookingApprovalCard',
  component: BookingApprovalCard,
  tags: ['autodocs'],
  args: {
    onDecision: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof BookingApprovalCard>;

const flightRequest: BookingApprovalRequest = {
  type: 'booking_approval',
  approvalId: 'create_flight_booking:f1',
  draftId: 'create_flight_booking:f1',
  action: 'create_flight_booking',
  title: 'Confirm flight booking',
  description: 'Tool execution requires approval',
  referenceId: 'f1',
  details: {
    flightId: 'f1',
    adults: 1,
    customerName: 'Thao Nguyen',
    customerEmail: 'thao@example.com',
  },
  totalPrice: 240,
  currency: 'USD',
  allowedDecisions: ['approve', 'edit', 'reject'],
};

export const FlightBooking: Story = {
  args: { request: flightRequest },
};

export const CancelBooking: Story = {
  name: 'Cancel booking',
  args: {
    request: {
      ...flightRequest,
      approvalId: 'cancel_booking:bk-1',
      action: 'cancel_booking',
      title: 'Confirm booking cancellation',
      details: { bookingId: 'bk-1' },
      totalPrice: undefined,
      currency: undefined,
      allowedDecisions: ['approve', 'reject'],
    },
  },
};
