import { render, screen, userEvent } from '@testing-library/react-native';

import { FlightCard } from '../FlightCard';
import { ThemeProvider } from '../../theme';
import { FLIGHT_TAB } from '@repo/constants';
import { makeFlight } from '../../test/fixtures';

import type { FlightSearchResult } from '@repo/types';

test('renders the header, count and flight options', async () => {
  const data: FlightSearchResult = { count: 1, results: [makeFlight({ flightNumber: 'VN123' })] };

  await render(
    <ThemeProvider>
      <FlightCard data={data} departureDate="2026-09-20" destination="HAN" origin="SGN" />
    </ThemeProvider>
  );

  expect(screen.getByText('✈️ SGN → HAN')).toBeOnTheScreen();
  expect(screen.getByText('1 flight found')).toBeOnTheScreen();
  expect(screen.getByText('Vietnam Airlines · VN123')).toBeOnTheScreen();
});

test('renders an empty state when there are no flights', async () => {
  const data: FlightSearchResult = { count: 0, results: [] };

  await render(
    <ThemeProvider>
      <FlightCard data={data} destination="HAN" origin="SGN" />
    </ThemeProvider>
  );

  expect(screen.getByText('No flights found for this route.')).toBeOnTheScreen();
});

test('selects and confirms a one-way flight', async () => {
  const flight = makeFlight();
  const data: FlightSearchResult = { count: 1, results: [flight] };
  const onSelect = jest.fn();
  const onContinueBooking = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <FlightCard
        data={data}
        destination="HAN"
        onContinueBooking={onContinueBooking}
        onSelect={onSelect}
        origin="SGN"
      />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Select' }));

  expect(screen.getByText('Selected')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Confirm' }));

  expect(onSelect).toHaveBeenCalledWith(flight, FLIGHT_TAB.DEPARTURE);
  expect(onContinueBooking).toHaveBeenCalledWith(flight, undefined);
  expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeOnTheScreen();
});

test('selects a departure and return flight across tabs', async () => {
  const departure = makeFlight({ id: 'd1' });
  const returnFlight = makeFlight({ id: 'r1', flightNumber: 'VN456' });
  const data: FlightSearchResult = {
    count: 1,
    results: [departure],
    returnCount: 1,
    returnResults: [returnFlight],
  };
  const onSelect = jest.fn();
  const onContinueBooking = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <FlightCard
        data={data}
        destination="HAN"
        onContinueBooking={onContinueBooking}
        onSelect={onSelect}
        origin="SGN"
      />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Select' }));

  expect(screen.getByText('Vietnam Airlines · VN456')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Select' }));

  expect(screen.getByText('Departure & return selected')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Confirm' }));

  expect(onSelect).toHaveBeenNthCalledWith(1, departure, FLIGHT_TAB.DEPARTURE);
  expect(onSelect).toHaveBeenNthCalledWith(2, returnFlight, FLIGHT_TAB.RETURN);
  expect(onContinueBooking).toHaveBeenCalledWith(departure, returnFlight);
});

test('disables the confirm banner while booking is locked', async () => {
  const flight = makeFlight();
  const data: FlightSearchResult = { count: 1, results: [flight] };

  await render(
    <ThemeProvider>
      <FlightCard
        data={data}
        destination="HAN"
        initialDeparture={flight}
        isBookingLocked
        onSelect={jest.fn()}
        origin="SGN"
      />
    </ThemeProvider>
  );

  expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
});

test('hides the banner when already confirmed', async () => {
  const flight = makeFlight();
  const data: FlightSearchResult = { count: 1, results: [flight] };

  await render(
    <ThemeProvider>
      <FlightCard
        data={data}
        destination="HAN"
        initialDeparture={flight}
        isConfirmed
        onSelect={jest.fn()}
        origin="SGN"
      />
    </ThemeProvider>
  );

  expect(screen.getByText('Selected')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeOnTheScreen();
});
