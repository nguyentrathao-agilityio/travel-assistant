import { render, screen } from '@testing-library/react-native';

import { TripCostBreakdown } from '../TripCostBreakdown';
import { ThemeProvider } from '../../theme';

import type { TripCostEstimate } from '@repo/schemas';

const makeEstimate = (overrides: Partial<TripCostEstimate> = {}): TripCostEstimate => ({
  grandTotal: 1500,
  currency: 'USD',
  days: 3,
  travelers: 2,
  flightTotal: 800,
  hotelTotal: 600,
  foodTotal: 100,
  activitiesTotal: 0,
  localTransportTotal: 0,
  breakdown: [
    { label: 'Flight', amount: 800, currency: 'USD' },
    { label: 'Hotel', amount: 600, currency: 'USD', note: '3 nights' },
    { label: 'Food', amount: 0, currency: 'USD' },
  ],
  ...overrides,
});

test('renders the estimated total section label', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate()} />
    </ThemeProvider>
  );

  expect(screen.getByText('💰 ESTIMATED TOTAL')).toBeOnTheScreen();
});

test('renders breakdown item labels', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Flight')).toBeOnTheScreen();
  expect(screen.getByText('Hotel')).toBeOnTheScreen();
  expect(screen.getByText('Food')).toBeOnTheScreen();
});

test('renders the note for a breakdown item that has one', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate()} />
    </ThemeProvider>
  );

  expect(screen.getByText('3 nights')).toBeOnTheScreen();
});

test('shows the formatted amount for a non-zero breakdown item', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate()} />
    </ThemeProvider>
  );

  expect(screen.getByText('~$800')).toBeOnTheScreen();
});

test('shows a dash for zero-amount breakdown items', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate()} />
    </ThemeProvider>
  );

  expect(screen.getByText('—')).toBeOnTheScreen();
});

test('renders the "Grand total" row with the formatted grand total', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Grand total')).toBeOnTheScreen();
  expect(screen.getByText('~$1,500')).toBeOnTheScreen();
});

test('shows plural nights and travelers when both are greater than one', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate({ days: 3, travelers: 2 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('3 nights · 2 travelers')).toBeOnTheScreen();
});

test('shows singular night and traveler when both are exactly one', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate({ days: 1, travelers: 1 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('1 night · 1 traveler')).toBeOnTheScreen();
});

test('selects the flight icon for a flight-related label', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate()} />
    </ThemeProvider>
  );

  expect(screen.getByText('✈️')).toBeOnTheScreen();
});

test('selects the hotel icon for a hotel-related label', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown estimate={makeEstimate()} />
    </ThemeProvider>
  );

  expect(screen.getByText('🏨')).toBeOnTheScreen();
});

test('selects the fallback icon for an unrecognized label', async () => {
  await render(
    <ThemeProvider>
      <TripCostBreakdown
        estimate={makeEstimate({
          breakdown: [{ label: 'Insurance', amount: 50, currency: 'USD' }],
        })}
      />
    </ThemeProvider>
  );

  expect(screen.getByText('🏷️')).toBeOnTheScreen();
});
