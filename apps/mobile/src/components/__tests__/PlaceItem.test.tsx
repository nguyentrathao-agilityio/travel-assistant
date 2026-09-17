import { render, screen } from '@testing-library/react-native';

import { PlaceItem } from '../PlaceItem';
import { ThemeProvider } from '../../theme';

import type { Place } from '@repo/types';

const findNodeType = (node: unknown, type: string): boolean => {
  if (!node || typeof node !== 'object') return false;

  const { type: nodeType, children } = node as { type?: string; children?: unknown[] };

  if (nodeType === type) return true;
  if (!children) return false;

  return children.some((child) => findNodeType(child, type));
};

const makePlace = (overrides: Partial<Place> = {}): Place => ({
  id: 'p1',
  shortCode: 'P1',
  name: 'Marble Mountains',
  city: 'Da Nang',
  country: 'Vietnam',
  category: 'attraction',
  description: 'Famous marble formation.',
  address: 'Marble St',
  rating: 4.5,
  reviewCount: 500,
  priceLevel: 1,
  openingHours: '8:00 AM - 5:00 PM',
  imageUrl: 'https://example.com/marble.jpg',
  tags: ['nature'],
  isRecommended: true,
  ...overrides,
});

test('renders the place name', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Marble Mountains')).toBeOnTheScreen();
});

test('renders the description when present', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Famous marble formation.')).toBeOnTheScreen();
});

test('hides the description when empty', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ description: '' })} />
    </ThemeProvider>
  );

  expect(screen.queryByText('Famous marble formation.')).not.toBeOnTheScreen();
});

test('renders the recommended star when isRecommended is true', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ isRecommended: true })} />
    </ThemeProvider>
  );

  expect(screen.getByText('⭐')).toBeOnTheScreen();
});

test('hides the recommended star when isRecommended is false', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ isRecommended: false })} />
    </ThemeProvider>
  );

  expect(screen.queryByText('⭐')).not.toBeOnTheScreen();
});

test('renders the category label', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ category: 'restaurant' })} />
    </ThemeProvider>
  );

  expect(screen.getByText('🍽️ Restaurant')).toBeOnTheScreen();
});

test('renders the rating and review count', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ rating: 4.5, reviewCount: 500 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('⭐ 4.5 (500)')).toBeOnTheScreen();
});

test('renders the price level label', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ priceLevel: 3 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('🎫 $$')).toBeOnTheScreen();
});

test('falls back to the default price label for an unknown price level', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ priceLevel: 99 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('🎫 $')).toBeOnTheScreen();
});

test('renders opening hours when present', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ openingHours: '8:00 AM - 5:00 PM' })} />
    </ThemeProvider>
  );

  expect(screen.getByText('🕒 8:00 AM - 5:00 PM')).toBeOnTheScreen();
});

test('hides opening hours when absent', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ openingHours: undefined })} />
    </ThemeProvider>
  );

  expect(screen.queryByText(/^🕒/)).not.toBeOnTheScreen();
});

test('renders the thumbnail image when imageUrl is present', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ imageUrl: 'https://example.com/marble.jpg' })} />
    </ThemeProvider>
  );

  expect(findNodeType(screen.toJSON(), 'Image')).toBe(true);
});

test('hides the thumbnail image when imageUrl is empty', async () => {
  await render(
    <ThemeProvider>
      <PlaceItem place={makePlace({ imageUrl: '' })} />
    </ThemeProvider>
  );

  expect(findNodeType(screen.toJSON(), 'Image')).toBe(false);
});
