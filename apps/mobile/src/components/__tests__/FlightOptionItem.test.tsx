import { render, screen, userEvent } from '@testing-library/react-native';

import { FlightOptionItem } from '../FlightOptionItem';
import { ThemeProvider } from '../../theme';

import type { Flight } from '@repo/types';

const baseFlight: Flight = {
  id: 'f1',
  airline: { code: 'VN', name: 'Vietnam Airlines' },
  flightNumber: 'VN123',
  origin: 'SGN',
  destination: 'HAN',
  departureTime: '2026-09-20T08:00:00',
  arrivalTime: '2026-09-20T10:00:00',
  durationMinutes: 120,
  price: 1500000,
  currency: 'VND',
  seatsAvailable: 20,
  stops: 0,
};

test('renders flight details', async () => {
  await render(
    <ThemeProvider>
      <FlightOptionItem flight={baseFlight} />
    </ThemeProvider>
  );

  expect(screen.getByText('Vietnam Airlines · VN123')).toBeOnTheScreen();
  expect(screen.getByText('🕒 08:00 → 10:00')).toBeOnTheScreen();
  expect(screen.getByText('⏳ 2h · 📡 Direct')).toBeOnTheScreen();
  expect(screen.queryByText(/seats left/)).not.toBeOnTheScreen();
});

test('shows a low seats warning below the threshold', async () => {
  await render(
    <ThemeProvider>
      <FlightOptionItem flight={{ ...baseFlight, seatsAvailable: 3 }} />
    </ThemeProvider>
  );

  expect(screen.getByText('✈️ 3 seats left')).toBeOnTheScreen();
});

test('pluralizes the stops label', async () => {
  await render(
    <ThemeProvider>
      <FlightOptionItem flight={{ ...baseFlight, stops: 2 }} />
    </ThemeProvider>
  );

  expect(screen.getByText('⏳ 2h · 📡 2 stops')).toBeOnTheScreen();
});

test('renders a badge when given one', async () => {
  await render(
    <ThemeProvider>
      <FlightOptionItem badge={{ label: '💵 Cheapest' }} flight={baseFlight} />
    </ThemeProvider>
  );

  expect(screen.getByText('💵 Cheapest')).toBeOnTheScreen();
});

test('renders nothing selectable without an onSelect handler', async () => {
  await render(
    <ThemeProvider>
      <FlightOptionItem flight={baseFlight} />
    </ThemeProvider>
  );

  expect(screen.queryByRole('button', { name: 'Select' })).not.toBeOnTheScreen();
  expect(screen.queryByText('Selected')).not.toBeOnTheScreen();
});

test('selects a flight', async () => {
  const onSelect = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <FlightOptionItem flight={baseFlight} onSelect={onSelect} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Select' }));

  expect(onSelect).toHaveBeenCalledWith('f1');
});

test('shows a selected state instead of the select button', async () => {
  await render(
    <ThemeProvider>
      <FlightOptionItem flight={baseFlight} isSelected onSelect={jest.fn()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Selected')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Select' })).not.toBeOnTheScreen();
});

test('disables selection when booking is locked', async () => {
  const onSelect = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <FlightOptionItem flight={baseFlight} isBookingLocked onSelect={onSelect} />
    </ThemeProvider>
  );

  const button = screen.getByRole('button', { name: 'Select' });

  expect(button).toBeDisabled();

  await user.press(button);

  expect(onSelect).not.toHaveBeenCalled();
});
