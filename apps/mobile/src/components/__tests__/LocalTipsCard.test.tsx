import { render, screen } from '@testing-library/react-native';

import { LocalTipsCard } from '../LocalTipsCard';
import { ThemeProvider } from '../../theme';

import type { TipsResult } from '@repo/types';

const makeData = (overrides: Partial<TipsResult> = {}): TipsResult => ({
  city: 'Da Nang',
  country: 'Vietnam',
  count: 2,
  summary: 'Essential tips for your visit.',
  tips: [
    {
      id: 't1',
      category: 'transport',
      scope: 'city',
      title: 'Use Grab',
      content: 'Grab is the best way to get around.',
      isEssential: true,
    },
    {
      id: 't2',
      category: 'food',
      scope: 'city',
      title: 'Try Banh Mi',
      content: 'Local banh mi shops are excellent.',
      isEssential: false,
    },
  ],
  ...overrides,
});

test('renders the city in the header', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText('💡 Local tips: Da Nang')).toBeOnTheScreen();
});

test('renders "Local tips" without city when city is absent', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData({ city: undefined })} />
    </ThemeProvider>
  );

  expect(screen.getByText('💡 Local tips')).toBeOnTheScreen();
});

test('renders the plural tip count', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData({ count: 2 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('2 tips')).toBeOnTheScreen();
});

test('renders the singular tip count', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData({ count: 1 })} />
    </ThemeProvider>
  );

  expect(screen.getByText('1 tip')).toBeOnTheScreen();
});

test('renders the summary when present', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Essential tips for your visit.')).toBeOnTheScreen();
});

test('hides the summary when empty', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData({ summary: '' })} />
    </ThemeProvider>
  );

  expect(screen.queryByText('Essential tips for your visit.')).not.toBeOnTheScreen();
});

test('renders all tip titles and content', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Use Grab')).toBeOnTheScreen();
  expect(screen.getByText('Try Banh Mi')).toBeOnTheScreen();
  expect(screen.getByText('Grab is the best way to get around.')).toBeOnTheScreen();
});

test('renders the essential badge only for essential tips', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getAllByText('⭐ Essential')).toHaveLength(1);
});

test('renders category badges for all tips', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData()} />
    </ThemeProvider>
  );

  expect(screen.getByText('🚌 Transport')).toBeOnTheScreen();
  expect(screen.getByText('🍜 Food')).toBeOnTheScreen();
});

test('renders the empty state when there are no tips', async () => {
  await render(
    <ThemeProvider>
      <LocalTipsCard data={makeData({ tips: [] })} />
    </ThemeProvider>
  );

  expect(screen.getByText('No local tips were available for this destination.')).toBeOnTheScreen();
});
