import { render, screen } from '@testing-library/react-native';

import { DestinationExplorerCard } from '../DestinationExplorerCard';
import { ThemeProvider } from '../../theme';

import type { DestinationExplorerResult } from '@repo/schemas';

jest.mock('../TripPlacesSection', () => {
  const { Text } = require('react-native');

  return {
    TripPlacesSection: ({ places }: { places: { results: { id: string }[] } }) => (
      <Text testID="trip-places-section">{places.results.length} places</Text>
    ),
  };
});

jest.mock('../TripTipsSection', () => {
  const { Text } = require('react-native');

  return {
    TripTipsSection: ({ tips }: { tips: { tips: { id: string }[] } }) => (
      <Text testID="trip-tips-section">{tips.tips.length} tips</Text>
    ),
  };
});

const makeData = (
  overrides: Partial<DestinationExplorerResult> = {}
): DestinationExplorerResult => ({
  city: 'Da Nang',
  places: null,
  tips: null,
  weather: null,
  ...overrides,
});

const makeWeather = (overrides: Partial<DestinationExplorerResult['weather']> = {}) => ({
  location: { name: 'Da Nang', country: 'Vietnam', latitude: 16.05, longitude: 108.2 },
  current: {
    time: '2026-09-17T10:00:00',
    temperatureC: 30,
    apparentTemperatureC: 33,
    relativeHumidity: 70,
    windSpeedKmh: 10,
    description: 'Sunny',
  },
  travelTip: 'Bring sunscreen',
  ...overrides,
});

const makeTips = () => ({
  city: 'Da Nang',
  country: 'Vietnam',
  count: 2,
  summary: 'Local tips',
  tips: [
    {
      id: 't1',
      category: 'transport' as const,
      scope: 'city' as const,
      title: 'Use Grab',
      content: 'Grab is easy',
      isEssential: true,
      location: null,
    },
  ],
});

const makePlaces = () => ({
  total: 1,
  city: 'Da Nang',
  results: [
    {
      id: 'p1',
      shortCode: 'P1',
      name: 'Marble Mountains',
      city: 'Da Nang',
      country: 'Vietnam',
      category: 'attraction' as const,
      description: 'Famous marble formation.',
      address: 'Marble St',
      rating: 4.5,
      reviewCount: 500,
      priceLevel: 1,
      imageUrl: 'https://example.com/marble.jpg',
      tags: ['nature'],
      isRecommended: true,
    },
  ],
});

test('renders the city heading', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText('📍 Da Nang')).toBeOnTheScreen();
});

test('renders weather info when weather is present', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData({ weather: makeWeather() })} />
    </ThemeProvider>
  );

  expect(screen.getByText('WEATHER NOW')).toBeOnTheScreen();
  expect(screen.getByText('30°C')).toBeOnTheScreen();
  expect(screen.getByText('· Sunny')).toBeOnTheScreen();
  expect(screen.getByText('Bring sunscreen')).toBeOnTheScreen();
});

test('does not render weather section when weather is absent', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.queryByText('WEATHER NOW')).not.toBeOnTheScreen();
});

test('hides the travel tip when it is empty', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData({ weather: makeWeather({ travelTip: '' }) })} />
    </ThemeProvider>
  );

  expect(screen.queryByText('Bring sunscreen')).not.toBeOnTheScreen();
});

test('renders the tips section when tips are present', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData({ tips: makeTips() })} />
    </ThemeProvider>
  );

  expect(screen.getByTestId('trip-tips-section')).toBeOnTheScreen();
});

test('does not render the tips section when tips are absent', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.queryByTestId('trip-tips-section')).not.toBeOnTheScreen();
});

test('does not render the tips section when tip count is zero', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData({ tips: { ...makeTips(), count: 0 } })} />
    </ThemeProvider>
  );

  expect(screen.queryByTestId('trip-tips-section')).not.toBeOnTheScreen();
});

test('renders the places section when places are present', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData({ places: makePlaces() })} />
    </ThemeProvider>
  );

  expect(screen.getByTestId('trip-places-section')).toBeOnTheScreen();
});

test('does not render the places section when places are absent', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.queryByTestId('trip-places-section')).not.toBeOnTheScreen();
});

test('does not render the places section when results are empty', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard data={makeData({ places: { ...makePlaces(), results: [] } })} />
    </ThemeProvider>
  );

  expect(screen.queryByTestId('trip-places-section')).not.toBeOnTheScreen();
});

test('renders weather, tips, and places sections together', async () => {
  await render(
    <ThemeProvider>
      <DestinationExplorerCard
        data={makeData({ weather: makeWeather(), tips: makeTips(), places: makePlaces() })}
      />
    </ThemeProvider>
  );

  expect(screen.getByText('WEATHER NOW')).toBeOnTheScreen();
  expect(screen.getByTestId('trip-tips-section')).toBeOnTheScreen();
  expect(screen.getByTestId('trip-places-section')).toBeOnTheScreen();
});
