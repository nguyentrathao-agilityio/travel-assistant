import { render, screen } from '@testing-library/react-native';

import { TripFlightSection } from '../TripFlightSection';
import { ThemeProvider } from '../../theme';
import { makeFlight } from '../../test/fixtures';

jest.mock('../FlightOptionItem', () => {
  const { Text } = require('react-native');

  return {
    FlightOptionItem: ({ flight }: { flight: { flightNumber: string } }) => (
      <Text testID="flight-option-item">{flight.flightNumber}</Text>
    ),
  };
});

test('renders nothing when neither suggested nor booked is provided', async () => {
  await render(
    <ThemeProvider>
      <TripFlightSection />
    </ThemeProvider>
  );

  expect(screen.toJSON()).toBeNull();
});

test('renders the suggested flight', async () => {
  await render(
    <ThemeProvider>
      <TripFlightSection suggested={makeFlight()} />
    </ThemeProvider>
  );

  expect(screen.getByTestId('flight-option-item')).toBeOnTheScreen();
  expect(screen.getByText('VN100')).toBeOnTheScreen();
});

test('shows the "suggested" badge when no booked flight is provided', async () => {
  await render(
    <ThemeProvider>
      <TripFlightSection suggested={makeFlight()} />
    </ThemeProvider>
  );

  expect(screen.getByText('suggested')).toBeOnTheScreen();
});

test('shows the "booked" badge when a booked flight is provided', async () => {
  await render(
    <ThemeProvider>
      <TripFlightSection booked={makeFlight()} />
    </ThemeProvider>
  );

  expect(screen.getByText('✓ booked')).toBeOnTheScreen();
});

test('prefers the booked flight over the suggested flight', async () => {
  await render(
    <ThemeProvider>
      <TripFlightSection
        booked={makeFlight({ flightNumber: 'VN100' })}
        suggested={makeFlight({ flightNumber: 'VN999' })}
      />
    </ThemeProvider>
  );

  expect(screen.getByText('VN100')).toBeOnTheScreen();
  expect(screen.queryByText('VN999')).not.toBeOnTheScreen();
});

test('renders a departure and return section when bookedReturn is provided', async () => {
  await render(
    <ThemeProvider>
      <TripFlightSection
        booked={makeFlight({ flightNumber: 'VN100' })}
        bookedReturn={makeFlight({ flightNumber: 'VN200' })}
      />
    </ThemeProvider>
  );

  expect(screen.getByText('DEPARTURE')).toBeOnTheScreen();
  expect(screen.getByText('RETURN')).toBeOnTheScreen();
  expect(screen.getAllByTestId('flight-option-item')).toHaveLength(2);
});

test('does not render departure/return labels when bookedReturn is absent', async () => {
  await render(
    <ThemeProvider>
      <TripFlightSection booked={makeFlight()} />
    </ThemeProvider>
  );

  expect(screen.queryByText('DEPARTURE')).not.toBeOnTheScreen();
  expect(screen.queryByText('RETURN')).not.toBeOnTheScreen();
});
