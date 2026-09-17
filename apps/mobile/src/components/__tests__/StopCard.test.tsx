import { render, screen, userEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { StopCard } from '../StopCard';
import { ThemeProvider } from '../../theme';

import type { LandmarkStop, TravelLeg } from '@repo/types';

const baseStop: LandmarkStop = {
  name: 'Hoan Kiem Lake',
  city: 'Hanoi',
  description: 'A scenic lake in the old quarter.',
  visitDurationMin: 90,
  openingHours: '06:00 - 22:00',
  entranceFee: 0,
  lat: 21.0285,
  lng: 105.8542,
};

test('renders the stop index, name, description and duration', async () => {
  await render(
    <ThemeProvider>
      <StopCard index={1} stop={baseStop} />
    </ThemeProvider>
  );

  expect(screen.getByText('1')).toBeOnTheScreen();
  expect(screen.getByText('Hoan Kiem Lake')).toBeOnTheScreen();
  expect(screen.getByText('A scenic lake in the old quarter.')).toBeOnTheScreen();
  expect(screen.getByText('~1h 30m')).toBeOnTheScreen();
  expect(screen.getByText('🕒 06:00 - 22:00')).toBeOnTheScreen();
});

test('shows free entry for a zero entrance fee', async () => {
  await render(
    <ThemeProvider>
      <StopCard index={1} stop={baseStop} />
    </ThemeProvider>
  );

  expect(screen.getByText('🎫 Free entry')).toBeOnTheScreen();
});

test('shows a formatted entrance fee when non-zero', async () => {
  await render(
    <ThemeProvider>
      <StopCard index={1} stop={{ ...baseStop, entranceFee: 50000 }} />
    </ThemeProvider>
  );

  expect(screen.getByText('🎫 50,000')).toBeOnTheScreen();
});

test('omits the entrance fee line when not provided', async () => {
  await render(
    <ThemeProvider>
      <StopCard index={1} stop={{ ...baseStop, entranceFee: undefined }} />
    </ThemeProvider>
  );

  expect(screen.queryByText(/🎫/)).not.toBeOnTheScreen();
});

test('opens the maps link when coordinates are available', async () => {
  const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <StopCard index={1} stop={baseStop} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('link', { name: '🔗 Map' }));

  expect(openUrlSpy).toHaveBeenCalledWith(
    'https://www.google.com/maps/search/?api=1&query=21.0285,105.8542'
  );

  openUrlSpy.mockRestore();
});

test('hides the maps link when coordinates are missing', async () => {
  await render(
    <ThemeProvider>
      <StopCard index={1} stop={{ ...baseStop, lat: undefined, lng: undefined }} />
    </ThemeProvider>
  );

  expect(screen.queryByRole('link', { name: '🔗 Map' })).not.toBeOnTheScreen();
});

test('renders the next leg transport and duration', async () => {
  const nextLeg: TravelLeg = { transport: 'walk', durationMin: 15, distanceKm: 1.2 };

  await render(
    <ThemeProvider>
      <StopCard index={1} nextLeg={nextLeg} stop={baseStop} />
    </ThemeProvider>
  );

  expect(screen.getByText('Walk · 15m · 1.2 km')).toBeOnTheScreen();
});
