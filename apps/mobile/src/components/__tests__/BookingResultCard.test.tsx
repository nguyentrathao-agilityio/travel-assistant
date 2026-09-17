import { render, screen } from '@testing-library/react-native';

import { BookingResultCard } from '../BookingResultCard';
import { ThemeProvider } from '../../theme';
import { BOOKING_STATUSES, BOOKING_TYPES } from '@repo/constants';
import { formatPrice } from '@repo/utils';

import type { Booking } from '@repo/types';

const baseBooking: Booking = {
  id: 'bk-1',
  confirmationCode: 'ABC123',
  type: BOOKING_TYPES.FLIGHT,
  referenceId: 'FL1',
  customerName: 'Tra Nguyen',
  customerEmail: 'traveler@example.com',
  totalPrice: 1500000,
  currency: 'VND',
  status: BOOKING_STATUSES.CONFIRMED,
  createdAt: '2026-09-17T00:00:00Z',
  summary: 'SGN to HAN, Sep 20',
};

test('renders a confirmed booking', async () => {
  await render(
    <ThemeProvider>
      <BookingResultCard booking={baseBooking} />
    </ThemeProvider>
  );

  expect(screen.getByText('Booking confirmed')).toBeOnTheScreen();
  expect(screen.getByText('SGN to HAN, Sep 20')).toBeOnTheScreen();
  expect(screen.getByText('ABC123')).toBeOnTheScreen();
  expect(screen.getByText(formatPrice(1500000, 'VND'))).toBeOnTheScreen();
});

test('renders a cancelled booking', async () => {
  await render(
    <ThemeProvider>
      <BookingResultCard booking={{ ...baseBooking, status: BOOKING_STATUSES.CANCELLED }} />
    </ThemeProvider>
  );

  expect(screen.getByText('Booking cancelled')).toBeOnTheScreen();
});
