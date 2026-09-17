import { SafeAreaProvider } from 'react-native-safe-area-context';

import { render, screen, userEvent } from '@testing-library/react-native';

import { DashboardScreen } from '../DashboardScreen';
import { ThemeProvider } from '../../theme';
import { makeThread, SAFE_AREA_INITIAL_METRICS } from '../../test/fixtures';

import type { ThreadItem } from '../../services';

const baseProps: Parameters<typeof DashboardScreen>[0] = {
  continueThreadId: null,
  isStartingTrip: false,
  onAskByVoice: jest.fn(),
  onOpenThread: jest.fn(),
  onRetryRecentThreads: jest.fn(),
  onSeeAll: jest.fn(),
  onStartNewTrip: jest.fn(),
  recentThreads: [] as ThreadItem[],
  recentThreadsStatus: 'ready' as const,
};

const renderScreen = async (props: Partial<Parameters<typeof DashboardScreen>[0]> = {}) => {
  const merged = { ...baseProps, ...props };

  await render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
      <ThemeProvider>
        <DashboardScreen {...merged} />
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return merged;
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders the greeting', async () => {
  await renderScreen();

  expect(screen.getByText('Alex Traveler')).toBeOnTheScreen();
});

test('pressing "Let’s Talk" asks by voice', async () => {
  const user = userEvent.setup();
  const { onAskByVoice } = await renderScreen();

  await user.press(screen.getByRole('button', { name: /Let.s Talk/ }));

  expect(onAskByVoice).toHaveBeenCalledTimes(1);
});

test('pressing "Start new chat" starts a new trip, and is disabled while starting', async () => {
  const user = userEvent.setup();
  const { onStartNewTrip } = await renderScreen();

  await user.press(screen.getAllByText('Start new chat')[0]);

  expect(onStartNewTrip).toHaveBeenCalledTimes(1);
});

test('"Start new chat" is disabled while a trip is starting', async () => {
  await renderScreen({ isStartingTrip: true });

  const startButtons = screen.getAllByRole('button', { name: 'Start new chat' });

  expect(startButtons.length).toBeGreaterThan(0);
  startButtons.forEach((button) => expect(button).toBeDisabled());
});

test('omits "Continue last trip" when there is no thread to continue', async () => {
  await renderScreen({ continueThreadId: null, recentThreads: [] });

  expect(screen.queryByText('Continue last trip')).not.toBeOnTheScreen();
});

test('pressing "Continue last trip" opens the continue thread', async () => {
  const user = userEvent.setup();
  const { onOpenThread } = await renderScreen({ continueThreadId: 'c1', recentThreads: [] });

  await user.press(screen.getByText('Continue last trip'));

  expect(onOpenThread).toHaveBeenCalledWith('c1');
});

test('falls back to the most recent thread when no continueThreadId is set', async () => {
  const user = userEvent.setup();
  const { onOpenThread } = await renderScreen({
    continueThreadId: null,
    recentThreads: [makeThread('r1', 'Hanoi trip')],
  });

  await user.press(screen.getByText('Continue last trip'));

  expect(onOpenThread).toHaveBeenCalledWith('r1');
});

test('shows a loading state for recent searches', async () => {
  await renderScreen({ recentThreadsStatus: 'loading' });

  expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
});

test('shows an error state and retries recent searches on press', async () => {
  const user = userEvent.setup();
  const { onRetryRecentThreads } = await renderScreen({ recentThreadsStatus: 'error' });

  expect(screen.getByText("Couldn't load recent trips.")).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Retry' }));

  expect(onRetryRecentThreads).toHaveBeenCalledTimes(1);
});

test('shows an empty state when there are no recent trips', async () => {
  await renderScreen({ recentThreadsStatus: 'ready', recentThreads: [] });

  expect(screen.getByText('Your trips will show up here.')).toBeOnTheScreen();
});

test('renders recent trips and opens one on press', async () => {
  const user = userEvent.setup();
  const { onOpenThread } = await renderScreen({
    recentThreadsStatus: 'ready',
    recentThreads: [makeThread('r1', 'Hoi An weekend'), makeThread('r2', null)],
  });

  expect(screen.getByText('Hoi An weekend')).toBeOnTheScreen();
  expect(screen.getByText('Untitled trip')).toBeOnTheScreen();

  await user.press(screen.getByText('Hoi An weekend'));

  expect(onOpenThread).toHaveBeenCalledWith('r1');
});

test('pressing "See all" calls onSeeAll', async () => {
  const user = userEvent.setup();
  const { onSeeAll } = await renderScreen();

  await user.press(screen.getByText('See all'));

  expect(onSeeAll).toHaveBeenCalledTimes(1);
});

test('the bottom nav voice button asks by voice', async () => {
  const user = userEvent.setup();
  const { onAskByVoice } = await renderScreen();

  await user.press(screen.getByLabelText('Open voice assistant'));

  expect(onAskByVoice).toHaveBeenCalledTimes(1);
});
