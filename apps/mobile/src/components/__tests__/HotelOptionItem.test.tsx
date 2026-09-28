import { render, screen, userEvent } from '@testing-library/react-native';

import { HotelOptionItem } from '../HotelOptionItem';
import { ThemeProvider } from '../../theme';

import type { HotelAvailability } from '@repo/types';

const baseHotel: HotelAvailability = {
  id: 'h1',
  shortCode: 'HAN01',
  name: 'Hanoi Grand Hotel',
  city: 'Hanoi',
  country: 'Vietnam',
  address: '1 Old Quarter St',
  starRating: 4,
  pricePerNight: 800000,
  currency: 'VND',
  amenities: ['Wifi', 'Pool', 'Breakfast', 'Gym', 'Spa', 'Parking'],
  rating: 4.5,
  reviewCount: 120,
  available: true,
  availableRooms: 5,
  maxOccupancyPerRoom: 2,
  nights: 3,
  totalPrice: 2400000,
};

interface JsonNode {
  type?: string;
  props?: Record<string, unknown>;
  children?: unknown;
}

const findNodeByType = (node: unknown, type: string): JsonNode | null => {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findNodeByType(child, type);
      if (match) return match;
    }
    return null;
  }

  const element = node as JsonNode;

  if (element.type === type) return element;

  return findNodeByType(element.children, type);
};

test('renders hotel details, ratings and limited amenities', async () => {
  const result = await render(
    <ThemeProvider>
      <HotelOptionItem hotel={baseHotel} />
    </ThemeProvider>
  );

  expect(screen.getByText('Hanoi Grand Hotel')).toBeOnTheScreen();
  expect(screen.getByText('⭐⭐⭐⭐')).toBeOnTheScreen();
  expect(screen.getByText('★ 4.5/5')).toBeOnTheScreen();
  expect(screen.getByText('Wifi')).toBeOnTheScreen();
  expect(screen.getByText('+1 more')).toBeOnTheScreen();
  expect(screen.getByText(/3 nights/)).toBeOnTheScreen();
  expect(findNodeByType(result.toJSON(), 'Image')).toBeNull();
});

test('renders a thumbnail image when one is given', async () => {
  const result = await render(
    <ThemeProvider>
      <HotelOptionItem hotel={{ ...baseHotel, imageUrl: 'https://example.com/hotel.jpg' }} />
    </ThemeProvider>
  );

  expect(findNodeByType(result.toJSON(), 'Image')).not.toBeNull();
});

test('downsamples remote hotel images before Android decodes them', async () => {
  const result = await render(
    <ThemeProvider>
      <HotelOptionItem hotel={{ ...baseHotel, imageUrl: 'https://example.com/hotel.jpg' }} />
    </ThemeProvider>
  );

  expect(findNodeByType(result.toJSON(), 'Image')?.props?.resizeMethod).toBe('resize');
});

test('renders a badge when given one', async () => {
  await render(
    <ThemeProvider>
      <HotelOptionItem badge={{ label: '💵 Cheapest' }} hotel={baseHotel} />
    </ThemeProvider>
  );

  expect(screen.getByText('💵 Cheapest')).toBeOnTheScreen();
});

test('renders nothing selectable without an onSelect handler', async () => {
  await render(
    <ThemeProvider>
      <HotelOptionItem hotel={baseHotel} />
    </ThemeProvider>
  );

  expect(screen.queryByRole('button', { name: 'Select' })).not.toBeOnTheScreen();
  expect(screen.queryByText('Selected')).not.toBeOnTheScreen();
});

test('selects a hotel', async () => {
  const onSelect = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <HotelOptionItem hotel={baseHotel} onSelect={onSelect} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Select' }));

  expect(onSelect).toHaveBeenCalledWith('h1');
});

test('shows a selected state instead of the select button', async () => {
  await render(
    <ThemeProvider>
      <HotelOptionItem hotel={baseHotel} isSelected onSelect={jest.fn()} />
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
      <HotelOptionItem hotel={baseHotel} isBookingLocked onSelect={onSelect} />
    </ThemeProvider>
  );

  const button = screen.getByRole('button', { name: 'Select' });

  expect(button).toBeDisabled();

  await user.press(button);

  expect(onSelect).not.toHaveBeenCalled();
});
