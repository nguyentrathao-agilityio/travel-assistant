import { render, screen } from '@testing-library/react-native';

import { TripPlacesSection } from '../TripPlacesSection';
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

const makePlaces = (count: number, total = count): PlaceSearchResult => ({
  total,
  results: Array.from({ length: count }, (_, i) => makePlace(`p${i + 1}`, `Place ${i + 1}`)),
});

test('renders nothing when there are no places', async () => {
  await render(
    <ThemeProvider>
      <TripPlacesSection places={makePlaces(0)} />
    </ThemeProvider>
  );

  expect(screen.toJSON()).toBeNull();
});

test('renders a place item for each place', async () => {
  await render(
    <ThemeProvider>
      <TripPlacesSection places={makePlaces(3)} />
    </ThemeProvider>
  );

  expect(screen.getAllByTestId('place-item')).toHaveLength(3);
  expect(screen.getByText('Place 1')).toBeOnTheScreen();
});

test('shows the displayed count in the header', async () => {
  await render(
    <ThemeProvider>
      <TripPlacesSection places={makePlaces(3, 15)} />
    </ThemeProvider>
  );

  expect(screen.getByText('3 total')).toBeOnTheScreen();
});

test('limits displayed places to 6', async () => {
  await render(
    <ThemeProvider>
      <TripPlacesSection places={makePlaces(10, 10)} />
    </ThemeProvider>
  );

  expect(screen.getAllByTestId('place-item')).toHaveLength(6);
  expect(screen.getByText('6 total')).toBeOnTheScreen();
});

test('renders all places when count is 6 or fewer', async () => {
  await render(
    <ThemeProvider>
      <TripPlacesSection places={makePlaces(4)} />
    </ThemeProvider>
  );

  expect(screen.getAllByTestId('place-item')).toHaveLength(4);
});
