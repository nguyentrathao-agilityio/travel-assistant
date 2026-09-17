import { render, screen } from '@testing-library/react-native';

import { TripHotelSection } from '../TripHotelSection';
import { ThemeProvider } from '../../theme';
import { makeSchemaHotel } from '../../test/fixtures';

import type { Hotel } from '@repo/types';

jest.mock('../HotelOptionItem', () => {
  const { Text } = require('react-native');

  return {
    HotelOptionItem: ({
      hotel,
    }: {
      hotel: { name: string; totalPrice: number; nights: number };
    }) => (
      <Text testID="hotel-option-item">
        {hotel.name}:{hotel.totalPrice}:{hotel.nights}
      </Text>
    ),
  };
});

const makeBookedHotel = (overrides: Partial<Hotel> = {}): Hotel => ({
  id: 'h1',
  shortCode: 'H1',
  name: 'Hotel A',
  city: 'Da Nang',
  country: 'Vietnam',
  address: '1 Beach Rd',
  starRating: 4,
  pricePerNight: 80,
  currency: 'USD',
  amenities: ['WiFi', 'Pool'],
  rating: 4.2,
  reviewCount: 200,
  ...overrides,
});

const suggestedHotelB = { name: 'Hotel B', nights: 3, totalPrice: 360 };

test('renders nothing when neither suggested nor booked is provided', async () => {
  await render(
    <ThemeProvider>
      <TripHotelSection nights={3} />
    </ThemeProvider>
  );

  expect(screen.toJSON()).toBeNull();
});

test('renders the suggested hotel', async () => {
  await render(
    <ThemeProvider>
      <TripHotelSection nights={3} suggested={makeSchemaHotel(suggestedHotelB)} />
    </ThemeProvider>
  );

  expect(screen.getByTestId('hotel-option-item')).toBeOnTheScreen();
  expect(screen.getByText('Hotel B:360:3')).toBeOnTheScreen();
});

test('shows the "suggested" badge when no booked hotel is provided', async () => {
  await render(
    <ThemeProvider>
      <TripHotelSection nights={3} suggested={makeSchemaHotel(suggestedHotelB)} />
    </ThemeProvider>
  );

  expect(screen.getByText('suggested')).toBeOnTheScreen();
});

test('shows the "booked" badge and computes total price for a booked hotel', async () => {
  await render(
    <ThemeProvider>
      <TripHotelSection nights={4} booked={makeBookedHotel({ pricePerNight: 80 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('✓ booked')).toBeOnTheScreen();
  expect(screen.getByText('Hotel A:320:4')).toBeOnTheScreen();
});

test('prefers the booked hotel over the suggested hotel', async () => {
  await render(
    <ThemeProvider>
      <TripHotelSection
        nights={2}
        booked={makeBookedHotel({ name: 'Hotel A' })}
        suggested={makeSchemaHotel({ name: 'Hotel B' })}
      />
    </ThemeProvider>
  );

  expect(screen.getByText(/^Hotel A:/)).toBeOnTheScreen();
  expect(screen.queryByText(/^Hotel B:/)).not.toBeOnTheScreen();
});
