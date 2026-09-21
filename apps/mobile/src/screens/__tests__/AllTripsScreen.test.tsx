import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AllTripsScreen } from '../AllTripsScreen';
import { ThemeProvider } from '../../theme';
import { makeThread, SAFE_AREA_INITIAL_METRICS } from '../../test/fixtures';

import type { ThreadItem } from '../../services';

const baseProps: Parameters<typeof AllTripsScreen>[0] = {
  deletingThreadId: null,
  hasMore: false,
  isDeletingAll: false,
  isLoadingMore: false,
  isStartingTrip: false,
  loadMoreFailed: false,
  onAskByVoice: jest.fn(),
  onBack: jest.fn(),
  onDeleteAllTrips: jest.fn(),
  onDeleteThread: jest.fn(),
  onGoHome: jest.fn(),
  onLoadMore: jest.fn(),
  onOpenThread: jest.fn(),
  onRetry: jest.fn(),
  onStartNewTrip: jest.fn(),
  status: 'ready' as const,
  threads: [] as ThreadItem[],
};

const renderScreen = async (props: Partial<Parameters<typeof AllTripsScreen>[0]> = {}) => {
  const merged = { ...baseProps, ...props };

  await render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
      <ThemeProvider>
        <AllTripsScreen {...merged} />
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return merged;
};

const today = () => new Date().toISOString();

beforeEach(() => {
  jest.clearAllMocks();
});

test('header shows the title and wires back / delete-all buttons', async () => {
  const user = userEvent.setup();
  const { onBack, onDeleteAllTrips } = await renderScreen();

  expect(screen.getByText('All trips')).toBeOnTheScreen();

  await user.press(screen.getByLabelText('Back'));
  expect(onBack).toHaveBeenCalledTimes(1);

  await user.press(screen.getByLabelText('Delete all trips'));
  expect(onDeleteAllTrips).toHaveBeenCalledTimes(1);
});

test('shows a loading indicator while loading', async () => {
  await renderScreen({ status: 'loading' });

  expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
});

test('shows an error state and retries on press', async () => {
  const user = userEvent.setup();
  const { onRetry } = await renderScreen({ status: 'error' });

  expect(screen.getByText("Couldn't load your trips.")).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Retry' }));

  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('shows an empty state when there are no trips', async () => {
  await renderScreen({ status: 'ready', threads: [] });

  expect(screen.getByText('Your trips will show up here.')).toBeOnTheScreen();
});

test('renders each trip under a date section, falling back to "Untitled trip"', async () => {
  await renderScreen({
    status: 'ready',
    threads: [
      makeThread('1', 'Da Nang trip', { createdAt: today() }),
      makeThread('2', null, { createdAt: today() }),
    ],
  });

  expect(screen.getByText('TODAY')).toBeOnTheScreen();
  expect(screen.getByText('Da Nang trip')).toBeOnTheScreen();
  expect(screen.getByText('Untitled trip')).toBeOnTheScreen();
});

test('shows each trip’s created time', async () => {
  const createdAt = today();
  await renderScreen({
    status: 'ready',
    threads: [makeThread('1', 'Da Nang trip', { createdAt })],
  });

  const expectedTime = new Date(createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  expect(screen.getByText(expectedTime)).toBeOnTheScreen();
});

test('pressing a trip opens it', async () => {
  const user = userEvent.setup();
  const { onOpenThread } = await renderScreen({
    status: 'ready',
    threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })],
  });

  await user.press(screen.getByText('Da Nang trip'));

  expect(onOpenThread).toHaveBeenCalledWith('1');
});

test('pressing delete removes the trip and disables its own button while deleting', async () => {
  const user = userEvent.setup();
  const { onDeleteThread } = await renderScreen({
    status: 'ready',
    threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })],
    deletingThreadId: '1',
  });

  expect(screen.getByLabelText('Delete trip')).toBeDisabled();

  await user.press(screen.getByLabelText('Delete trip'));

  expect(onDeleteThread).not.toHaveBeenCalled();
});

test('pressing delete on a non-busy trip calls onDeleteThread', async () => {
  const user = userEvent.setup();
  const busyThread = makeThread('1', 'Da Nang trip', { createdAt: today() });
  const { onDeleteThread } = await renderScreen({
    status: 'ready',
    threads: [busyThread],
    deletingThreadId: null,
  });

  await user.press(screen.getByLabelText('Delete trip'));

  expect(onDeleteThread).toHaveBeenCalledWith(busyThread);
});

test('shows a retry affordance when loading more fails', async () => {
  const user = userEvent.setup();
  const { onLoadMore } = await renderScreen({
    status: 'ready',
    threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })],
    hasMore: true,
    loadMoreFailed: true,
  });

  expect(screen.getByText("Couldn't load more trips.")).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Retry' }));

  expect(onLoadMore).toHaveBeenCalledTimes(1);
});

test('typing in the search bar filters trips by title', async () => {
  const user = userEvent.setup();
  await renderScreen({
    status: 'ready',
    threads: [
      makeThread('1', 'Da Nang trip', { createdAt: today() }),
      makeThread('2', 'Hanoi trip', { createdAt: today() }),
    ],
  });

  await user.type(screen.getByPlaceholderText('Search your trips'), 'Hanoi');

  await waitFor(() => {
    expect(screen.queryByText('Da Nang trip')).toBeNull();
  });
  expect(screen.getByText('Hanoi trip')).toBeOnTheScreen();
});

test('shows a no-results state when the search matches nothing', async () => {
  const user = userEvent.setup();
  await renderScreen({
    status: 'ready',
    threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })],
  });

  await user.type(screen.getByPlaceholderText('Search your trips'), 'Paris');

  await waitFor(() => {
    expect(screen.getByText('No trips match your search.')).toBeOnTheScreen();
  });
});

test('bottom nav buttons invoke their callbacks', async () => {
  const user = userEvent.setup();
  const { onGoHome, onAskByVoice, onStartNewTrip } = await renderScreen();

  await user.press(screen.getByLabelText('Home'));
  await user.press(screen.getByLabelText('Open voice assistant'));
  await user.press(screen.getByLabelText('Start new chat'));

  expect(onGoHome).toHaveBeenCalledTimes(1);
  expect(onAskByVoice).toHaveBeenCalledTimes(1);
  expect(onStartNewTrip).toHaveBeenCalledTimes(1);
});

test('hides the bottom nav while the search bar is focused, restoring it on blur', async () => {
  await renderScreen();

  expect(screen.getByLabelText('Home')).toBeOnTheScreen();

  await fireEvent(screen.getByPlaceholderText('Search your trips'), 'focus');
  expect(screen.queryByLabelText('Home')).toBeNull();

  await fireEvent(screen.getByPlaceholderText('Search your trips'), 'blur');
  expect(screen.getByLabelText('Home')).toBeOnTheScreen();
});
