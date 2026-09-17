import { render, screen } from '@testing-library/react-native';

import { TripSummaryCard } from '../TripSummaryCard';
import { ThemeProvider } from '../../theme';
import { makeSchemaHotel } from '../../test/fixtures';

import type { TripSummaryResult } from '@repo/schemas';
import type { Hotel, SelectedFlight } from '@repo/types';

const suggestedFlight: TripSummaryResult['suggestedFlight'] = {
  id: 'f1',
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flightNumber: 'VN123',
  origin: 'SGN',
  destination: 'DAD',
  departureTime: '2026-10-01T08:00:00Z',
  arrivalTime: '2026-10-01T09:30:00Z',
  durationMinutes: 90,
  price: 120,
  currency: 'USD',
  seatsAvailable: 20,
  stops: 0,
};

const suggestedHotel: TripSummaryResult['suggestedHotel'] = makeSchemaHotel({
  shortCode: 'DAD01',
  code: 'DAD01',
  name: 'Ocean View Hotel',
  address: '123 Beach Rd',
  pricePerNight: 80,
  amenities: ['wifi', 'pool'],
  nights: 3,
  totalPrice: 240,
});

const makeData = (overrides: Partial<TripSummaryResult> = {}): TripSummaryResult => ({
  destination: 'Da Nang',
  startDate: '2026-10-01',
  endDate: '2026-10-04',
  travelers: 2,
  days: 3,
  suggestedFlight,
  suggestedHotel,
  route: {
    city: 'Da Nang',
    totalDurationMin: 120,
    stops: [{ name: 'Dragon Bridge', city: 'Da Nang' }],
    legs: [],
  },
  costEstimate: {
    flightTotal: 240,
    hotelTotal: 240,
    foodTotal: 100,
    activitiesTotal: 50,
    localTransportTotal: 20,
    grandTotal: 650,
    currency: 'USD',
    days: 3,
    travelers: 2,
    breakdown: [
      { label: 'Flight', amount: 240, currency: 'USD' },
      { label: 'Hotel', amount: 240, currency: 'USD' },
    ],
  },
  ...overrides,
});

test('renders destination, dates and traveler/night counts', async () => {
  await render(
    <ThemeProvider>
      <TripSummaryCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText(/Da Nang/)).toBeOnTheScreen();
  expect(screen.getByText('trip summary')).toBeOnTheScreen();
  expect(screen.getByText('👤 2 travelers')).toBeOnTheScreen();
  expect(screen.getByText('3 nights')).toBeOnTheScreen();
});

test('renders flight, hotel and route sections when present', async () => {
  await render(
    <ThemeProvider>
      <TripSummaryCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText('✈️ FLIGHT')).toBeOnTheScreen();
  expect(screen.getByText('🏨 HOTEL')).toBeOnTheScreen();
  expect(screen.getByText('📍 DAY-BY-DAY PLAN')).toBeOnTheScreen();
  expect(screen.getByText('💰 ESTIMATED TOTAL')).toBeOnTheScreen();
});

test('hides flight, hotel and route sections when absent', async () => {
  const data = makeData({ suggestedFlight: null, suggestedHotel: null, route: null });

  await render(
    <ThemeProvider>
      <TripSummaryCard data={data} />
    </ThemeProvider>
  );

  expect(screen.queryByText('✈️ FLIGHT')).not.toBeOnTheScreen();
  expect(screen.queryByText('🏨 HOTEL')).not.toBeOnTheScreen();
  expect(screen.queryByText('📍 DAY-BY-DAY PLAN')).not.toBeOnTheScreen();
  expect(screen.getByText('💰 ESTIMATED TOTAL')).toBeOnTheScreen();
});

test('marks flight and hotel as booked when booked props are provided', async () => {
  const bookedFlight: SelectedFlight = {
    departure: {
      id: 'f2',
      airline: { code: 'VJ', name: 'VietJet' },
      flightNumber: 'VJ456',
      origin: 'SGN',
      destination: 'DAD',
      departureTime: '2026-10-01T08:00:00Z',
      arrivalTime: '2026-10-01T09:30:00Z',
      durationMinutes: 90,
      price: 150,
      currency: 'USD',
      seatsAvailable: 10,
      stops: 0,
    },
  };
  const bookedHotel: Hotel = {
    id: 'h2',
    shortCode: 'DAD02',
    name: 'Riverside Hotel',
    city: 'Da Nang',
    country: 'Vietnam',
    address: '456 River Rd',
    starRating: 5,
    pricePerNight: 100,
    currency: 'USD',
    amenities: ['wifi'],
    rating: 4.8,
    reviewCount: 50,
  };

  await render(
    <ThemeProvider>
      <TripSummaryCard bookedFlight={bookedFlight} bookedHotel={bookedHotel} data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getAllByText('✓ booked')).toHaveLength(2);
});
