import { render, screen } from '@testing-library/react-native';

import { RouteCard } from '../RouteCard';
import { ThemeProvider } from '../../theme';

import type { LandmarkTourRoute } from '@repo/types';

jest.mock('../StopCard', () => {
  const { Text } = require('react-native');

  return {
    StopCard: ({
      stop,
      nextLeg,
    }: {
      stop: { name: string };
      index: number;
      nextLeg?: { transport: string };
    }) => (
      <Text testID="stop-card">
        {stop.name}
        {nextLeg ? ':has-leg' : ''}
      </Text>
    ),
  };
});

const makeRoute = (overrides: Partial<LandmarkTourRoute> = {}): LandmarkTourRoute => ({
  city: 'Da Nang',
  totalDurationMin: 240,
  stops: [
    { name: 'Marble Mountains', city: 'Da Nang' },
    { name: 'Dragon Bridge', city: 'Da Nang' },
  ],
  legs: [{ mode: 'walk', durationMin: 15, distanceKm: 1.2 }],
  ...overrides,
});

test('renders the city route header', async () => {
  await render(
    <ThemeProvider>
      <RouteCard data={makeRoute()} />
    </ThemeProvider>
  );

  expect(screen.getByText('📍 Da Nang landmark route')).toBeOnTheScreen();
});

test('renders the total duration', async () => {
  await render(
    <ThemeProvider>
      <RouteCard data={makeRoute({ totalDurationMin: 240 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('⏱ 4h')).toBeOnTheScreen();
});

test('renders the plural stop count', async () => {
  await render(
    <ThemeProvider>
      <RouteCard data={makeRoute()} />
    </ThemeProvider>
  );

  expect(screen.getByText('2 stops')).toBeOnTheScreen();
});

test('renders the singular stop count', async () => {
  await render(
    <ThemeProvider>
      <RouteCard
        data={makeRoute({ stops: [{ name: 'Marble Mountains', city: 'Da Nang' }], legs: [] })}
      />
    </ThemeProvider>
  );

  expect(screen.getByText('1 stop')).toBeOnTheScreen();
});

test('renders a StopCard for each stop', async () => {
  await render(
    <ThemeProvider>
      <RouteCard data={makeRoute()} />
    </ThemeProvider>
  );

  expect(screen.getAllByTestId('stop-card')).toHaveLength(2);
  expect(screen.getByText('Marble Mountains:has-leg')).toBeOnTheScreen();
  expect(screen.getByText('Dragon Bridge')).toBeOnTheScreen();
});

test('renders no stop count or stop cards when stops list is empty', async () => {
  await render(
    <ThemeProvider>
      <RouteCard data={makeRoute({ stops: [], legs: [] })} />
    </ThemeProvider>
  );

  expect(screen.queryByTestId('stop-card')).not.toBeOnTheScreen();
  expect(screen.queryByText(/stop/)).not.toBeOnTheScreen();
});
