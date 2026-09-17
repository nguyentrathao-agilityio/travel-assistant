import { render, screen, userEvent } from '@testing-library/react-native';

import { HotelCard } from '../HotelCard';
import { ThemeProvider } from '../../theme';
import { makeHotel } from '../../test/fixtures';

import type { HotelSearchResult } from '@repo/types';

test('renders the header, count and hotel options', async () => {
  const data: HotelSearchResult = {
    total: 1,
    results: [makeHotel({ name: 'Hanoi Grand Hotel' })],
  };

  await render(
    <ThemeProvider>
      <HotelCard checkIn="2026-09-20" checkOut="2026-09-23" city="Hanoi" data={data} />
    </ThemeProvider>
  );

  expect(screen.getByText('🏨 Hotels in Hanoi')).toBeOnTheScreen();
  expect(screen.getByText('1 option found')).toBeOnTheScreen();
  expect(screen.getByText('Hanoi Grand Hotel')).toBeOnTheScreen();
});

test('renders an empty state when there are no hotels', async () => {
  const data: HotelSearchResult = { total: 0, results: [] };

  await render(
    <ThemeProvider>
      <HotelCard data={data} />
    </ThemeProvider>
  );

  expect(screen.getByText('No hotels found for these dates.')).toBeOnTheScreen();
});

test('selects and confirms a hotel', async () => {
  const hotel = makeHotel({ city: 'Hanoi', rating: 4.5 });
  const data: HotelSearchResult = { total: 1, results: [hotel] };
  const onSelect = jest.fn();
  const onContinueBooking = jest.fn();
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <HotelCard data={data} onContinueBooking={onContinueBooking} onSelect={onSelect} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Select' }));

  expect(screen.getByText('Selected')).toBeOnTheScreen();
  expect(screen.getByText('Hanoi · ★ 4.5/5')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Confirm' }));

  expect(onSelect).toHaveBeenCalledWith(hotel);
  expect(onContinueBooking).toHaveBeenCalledWith(hotel);
  expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeOnTheScreen();
});

test('resets selection when changing', async () => {
  const hotel = makeHotel();
  const data: HotelSearchResult = { total: 1, results: [hotel] };
  const user = userEvent.setup();

  await render(
    <ThemeProvider>
      <HotelCard data={data} onSelect={jest.fn()} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button', { name: 'Select' }));
  await user.press(screen.getByRole('button', { name: 'Change' }));

  expect(screen.getByRole('button', { name: 'Select' })).toBeOnTheScreen();
  expect(screen.queryByText('Selected')).not.toBeOnTheScreen();
});

test('disables the confirm banner while booking is locked', async () => {
  const hotel = makeHotel();
  const data: HotelSearchResult = { total: 1, results: [hotel] };

  await render(
    <ThemeProvider>
      <HotelCard data={data} initialHotel={hotel} isBookingLocked onSelect={jest.fn()} />
    </ThemeProvider>
  );

  expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
});

test('hides the banner when already confirmed', async () => {
  const hotel = makeHotel();
  const data: HotelSearchResult = { total: 1, results: [hotel] };

  await render(
    <ThemeProvider>
      <HotelCard data={data} initialHotel={hotel} isConfirmed onSelect={jest.fn()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Selected')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeOnTheScreen();
});
