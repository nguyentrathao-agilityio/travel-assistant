import { render, screen } from '@testing-library/react-native';

import { TripTipsSection } from '../TripTipsSection';
import { ThemeProvider } from '../../theme';

import type { TipsResult, Tip } from '@repo/types';

const makeTip = (
  id: string,
  title: string,
  isEssential: boolean,
  category: Tip['category'] = 'food'
): Tip => ({
  id,
  category,
  scope: 'city',
  title,
  content: `Content for ${title}`,
  isEssential,
  location: null,
});

test('renders nothing when tips array is empty', async () => {
  await render(
    <ThemeProvider>
      <TripTipsSection tips={{ country: 'Vietnam', count: 0, summary: '', tips: [] }} />
    </ThemeProvider>
  );

  expect(screen.toJSON()).toBeNull();
});

test('shows essential tips preferentially', async () => {
  const tips: TipsResult = {
    country: 'Vietnam',
    count: 3,
    summary: '',
    tips: [
      makeTip('t1', 'Essential Tip 1', true, 'transport'),
      makeTip('t2', 'Essential Tip 2', true, 'food'),
      makeTip('t3', 'Non-Essential Tip', false, 'money'),
    ],
  };

  await render(
    <ThemeProvider>
      <TripTipsSection tips={tips} />
    </ThemeProvider>
  );

  expect(screen.getByText('Essential Tip 1')).toBeOnTheScreen();
  expect(screen.getByText('Essential Tip 2')).toBeOnTheScreen();
  expect(screen.queryByText('Non-Essential Tip')).not.toBeOnTheScreen();
});

test('falls back to all tips when no essential tips exist', async () => {
  const tips: TipsResult = {
    country: 'Vietnam',
    count: 2,
    summary: '',
    tips: [
      makeTip('t1', 'Regular Tip 1', false, 'food'),
      makeTip('t2', 'Regular Tip 2', false, 'transport'),
    ],
  };

  await render(
    <ThemeProvider>
      <TripTipsSection tips={tips} />
    </ThemeProvider>
  );

  expect(screen.getByText('Regular Tip 1')).toBeOnTheScreen();
  expect(screen.getByText('Regular Tip 2')).toBeOnTheScreen();
});

test('shows the category label and content for each tip', async () => {
  const tips: TipsResult = {
    country: 'Vietnam',
    count: 1,
    summary: '',
    tips: [makeTip('t1', 'Food Tip', true, 'food')],
  };

  await render(
    <ThemeProvider>
      <TripTipsSection tips={tips} />
    </ThemeProvider>
  );

  expect(screen.getByText('🍜 Food')).toBeOnTheScreen();
  expect(screen.getByText('Content for Food Tip')).toBeOnTheScreen();
});

test('limits to MAX_TIPS (4) tips', async () => {
  const tipItems = Array.from({ length: 6 }, (_, i) =>
    makeTip(`t${i + 1}`, `Tip ${i + 1}`, true, 'food')
  );
  const tips: TipsResult = { country: 'Vietnam', count: 6, summary: '', tips: tipItems };

  await render(
    <ThemeProvider>
      <TripTipsSection tips={tips} />
    </ThemeProvider>
  );

  const renderedTips = screen.getAllByText(/^Tip \d+$/);

  expect(renderedTips).toHaveLength(4);
});
