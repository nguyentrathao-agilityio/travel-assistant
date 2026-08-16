import type { Meta, StoryObj } from '@storybook/react';

import { BookingResultCard } from './index';
import type { Booking } from '@repo/types';

const meta: Meta<typeof BookingResultCard> = {
  title: 'Components/BookingResultCard',
  component: BookingResultCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BookingResultCard>;

const confirmedBooking: Booking = {
  id: 'bk-1',
  confirmationCode: 'VN-4F2K9',
  type: 'flight',
  referenceId: 'f1',
  customerName: 'Thao Nguyen',
  customerEmail: 'thao@example.com',
  totalPrice: 240,
  currency: 'USD',
  status: 'confirmed',
  createdAt: '2026-08-16T08:00:00Z',
  summary: 'Flight VN100 from Hanoi to Da Nang on 2026-09-01.',
};

export const Confirmed: Story = {
  args: { booking: confirmedBooking },
};

export const Cancelled: Story = {
  args: {
    booking: {
      ...confirmedBooking,
      id: 'bk-2',
      type: 'hotel',
      status: 'cancelled',
      summary: 'Hotel booking at Hotel A, Da Nang cancelled.',
    },
  },
};
