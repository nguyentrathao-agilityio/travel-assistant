import { render, screen } from '@testing-library/react-native';

import { PlacesCard } from '../PlacesCard';
import { ThemeProvider } from '../../theme';
import { makePlace } from '../../test/fixtures';

import type { PlaceSearchResult } from '@repo/types';

jest.mock('../PlaceItem', () => {
  const { Text } = require('react-native');

  return {
    PlaceItem: ({ place }: { place: { id: string; name: string } }) => (
      <Text testID="place-item">{place.name}</Text>
    ),
  };
});

const makeData = (overrides: Partial<PlaceSearchResult> = {}): PlaceSearchResult => ({
  total: 2,
  city: 'Da Nang',
  results: [makePlace('p1', 'Marble Mountains'), makePlace('p2', 'Dragon Bridge')],
  ...overrides,
});

test('renders the city in the header', async () => {
  await render(
    <ThemeProvider>
      <PlacesCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText('📍 Places in Da Nang')).toBeOnTheScreen();
});

test('renders "Places" without city when city is absent', async () => {
  await render(
    <ThemeProvider>
      <PlacesCard data={makeData({ city: undefined })} />
    </ThemeProvider>
  );

  expect(screen.getByText('📍 Places')).toBeOnTheScreen();
});

test('renders the plural place count', async () => {
  await render(
    <ThemeProvider>
      <PlacesCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText('2 places')).toBeOnTheScreen();
});

test('renders the singular place count', async () => {
  await render(
    <ThemeProvider>
      <PlacesCard data={makeData({ total: 1, results: [makePlace('p1', 'Marble Mountains')] })} />
    </ThemeProvider>
  );

  expect(screen.getByText('1 place')).toBeOnTheScreen();
});

test('renders a PlaceItem for each result', async () => {
  await render(
    <ThemeProvider>
      <PlacesCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getAllByTestId('place-item')).toHaveLength(2);
  expect(screen.getByText('Marble Mountains')).toBeOnTheScreen();
  expect(screen.getByText('Dragon Bridge')).toBeOnTheScreen();
});

test('renders the empty state when results are empty', async () => {
  await render(
    <ThemeProvider>
      <PlacesCard data={makeData({ results: [] })} />
    </ThemeProvider>
  );

  expect(screen.getByText('No places in this category')).toBeOnTheScreen();
  expect(screen.queryByTestId('place-item')).not.toBeOnTheScreen();
});
