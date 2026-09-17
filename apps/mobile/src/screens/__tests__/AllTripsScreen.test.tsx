import { render, screen, userEvent } from '@testing-library/react-native';

import { AllTripsScreen } from '../AllTripsScreen';
import { ThemeProvider } from '../../theme';
import { makeThread } from '../../test/fixtures';

import type { ThreadItem } from '../../services';

const baseProps: Parameters<typeof AllTripsScreen>[0] = {
  deletingThreadId: null,
  hasMore: false,
  isLoadingMore: false,
  loadMoreFailed: false,
  onDeleteThread: jest.fn(),
  onLoadMore: jest.fn(),
  onOpenThread: jest.fn(),
  onRetry: jest.fn(),
  status: 'ready' as const,
  threads: [] as ThreadItem[],
};

const renderScreen = async (props: Partial<Parameters<typeof AllTripsScreen>[0]> = {}) => {
  const merged = { ...baseProps, ...props };

  await render(
    <ThemeProvider>
      <AllTripsScreen {...merged} />
    </ThemeProvider>
  );

  return merged;
};

beforeEach(() => {
  jest.clearAllMocks();
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

test('renders each trip, falling back to "Untitled trip"', async () => {
  await renderScreen({
    status: 'ready',
    threads: [makeThread('1', 'Da Nang trip'), makeThread('2', null)],
  });

  expect(screen.getByText('Da Nang trip')).toBeOnTheScreen();
  expect(screen.getByText('Untitled trip')).toBeOnTheScreen();
});

test('pressing a trip opens it', async () => {
  const user = userEvent.setup();
  const { onOpenThread } = await renderScreen({
    status: 'ready',
    threads: [makeThread('1', 'Da Nang trip')],
  });

  await user.press(screen.getByText('Da Nang trip'));

  expect(onOpenThread).toHaveBeenCalledWith('1');
});

test('pressing delete removes the trip and disables its own button while deleting', async () => {
  const user = userEvent.setup();
  const { onDeleteThread } = await renderScreen({
    status: 'ready',
    threads: [makeThread('1', 'Da Nang trip')],
    deletingThreadId: '1',
  });

  expect(screen.getByLabelText('Delete trip')).toBeDisabled();

  await user.press(screen.getByLabelText('Delete trip'));

  expect(onDeleteThread).not.toHaveBeenCalled();
});

test('pressing delete on a non-busy trip calls onDeleteThread', async () => {
  const user = userEvent.setup();
  const busyThread = makeThread('1', 'Da Nang trip');
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
    threads: [makeThread('1', 'Da Nang trip')],
    hasMore: true,
    loadMoreFailed: true,
  });

  expect(screen.getByText("Couldn't load more trips.")).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Retry' }));

  expect(onLoadMore).toHaveBeenCalledTimes(1);
});
