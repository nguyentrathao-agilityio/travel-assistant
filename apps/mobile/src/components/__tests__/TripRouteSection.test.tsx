import { render, screen, userEvent } from '@testing-library/react-native';

import { TripRouteSection } from '../TripRouteSection';
import { ThemeProvider } from '../../theme';

import type { RouteResult } from '@repo/schemas';

const makeRoute = (): RouteResult => ({
  city: 'Da Nang',
  totalDurationMin: 240,
  travelTip: 'Bring water',
  stops: [
    { name: 'Marble Mountains', city: 'Da Nang', visitDurationMin: 90, entranceFee: 5 },
    { name: 'Dragon Bridge', city: 'Da Nang', visitDurationMin: 30 },
    { name: 'Han Market', city: 'Da Nang' },
  ],
  legs: [{ mode: 'walk', durationMin: 15, distanceKm: 1.2 }],
});

test('renders nothing when no route is provided', async () => {
  await render(
    <ThemeProvider>
      <TripRouteSection days={1} />
    </ThemeProvider>
  );

  expect(screen.toJSON()).toBeNull();
});

test('renders nothing when route has no stops', async () => {
  await render(
    <ThemeProvider>
      <TripRouteSection days={1} route={{ ...makeRoute(), stops: [] }} />
    </ThemeProvider>
  );

  expect(screen.toJSON()).toBeNull();
});

test('renders the first day stops and entrance fee', async () => {
  await render(
    <ThemeProvider>
      <TripRouteSection days={2} route={makeRoute()} />
    </ThemeProvider>
  );

  expect(screen.getByText(/Marble Mountains/)).toBeOnTheScreen();
  expect(screen.getByText(/Dragon Bridge/)).toBeOnTheScreen();
  expect(screen.getByText('Entrance: $5')).toBeOnTheScreen();
  expect(screen.queryByText(/Han Market/)).not.toBeOnTheScreen();
});

test('does not show day tabs when only one day', async () => {
  await render(
    <ThemeProvider>
      <TripRouteSection days={1} route={makeRoute()} />
    </ThemeProvider>
  );

  expect(screen.queryByText('Day 2')).not.toBeOnTheScreen();
});

test('switches to the next day when its tab is pressed', async () => {
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <TripRouteSection days={2} route={makeRoute()} />
    </ThemeProvider>
  );

  await user.press(screen.getByText('Day 2'));

  expect(screen.getByText(/Han Market/)).toBeOnTheScreen();
  expect(screen.queryByText(/Marble Mountains/)).not.toBeOnTheScreen();
});

test('shows the travel tip when present', async () => {
  await render(
    <ThemeProvider>
      <TripRouteSection days={1} route={makeRoute()} />
    </ThemeProvider>
  );

  expect(screen.getByText(/Bring water/)).toBeOnTheScreen();
});

test('hides the travel tip when absent', async () => {
  await render(
    <ThemeProvider>
      <TripRouteSection days={1} route={{ ...makeRoute(), travelTip: undefined }} />
    </ThemeProvider>
  );

  expect(screen.queryByText(/Bring water/)).not.toBeOnTheScreen();
});
