import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AllTripsScreen } from '../AllTripsScreen';
import { ThemeProvider } from '../../theme';
import { makeThread, SAFE_AREA_INITIAL_METRICS } from '../../test/fixtures';

import type { AllTripsListProps } from '../AllTripsScreen';
import type { ThreadDeletionProps, ThreadRenameProps } from '../../hooks';
import type { ThreadItem } from '../../services';

jest.mock('react-native-reanimated', () => {
  const { useRef } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: { View },
    Extrapolation: { CLAMP: 'clamp' },
    interpolate: () => 0,
    useAnimatedStyle: (fn: () => unknown) => fn(),
    useDerivedValue: (fn: () => unknown) =>
      useRef({
        get value() {
          return fn();
        },
      }).current,
    useSharedValue: (initial: unknown) => useRef({ value: initial }).current,
    withRepeat: (animation: unknown) => animation,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withTiming: (toValue: unknown) => toValue,
  };
});

const baseList: AllTripsListProps = {
  hasMore: false,
  isLoadingMore: false,
  loadMoreFailed: false,
  onLoadMore: jest.fn(),
  onRetry: jest.fn(),
  status: 'ready',
  syncFailed: false,
  threads: [] as ThreadItem[],
};

const baseDeletion: ThreadDeletionProps = {
  deletingThreadId: null,
  isDeletingAll: false,
  onDeleteAllTrips: jest.fn(),
  onDeleteThread: jest.fn(),
};

const baseRename: ThreadRenameProps = {
  isRenaming: false,
  onCancelRename: jest.fn(),
  onConfirmRename: jest.fn(),
  onStartRename: jest.fn(),
  renamingThread: null,
};

const baseProps: Parameters<typeof AllTripsScreen>[0] = {
  deletion: baseDeletion,
  isStartingTrip: false,
  list: baseList,
  onAskByVoice: jest.fn(),
  onBack: jest.fn(),
  onGoHome: jest.fn(),
  onOpenThread: jest.fn(),
  onStartNewTrip: jest.fn(),
  rename: baseRename,
};

const renderScreen = async (
  props: Partial<Omit<Parameters<typeof AllTripsScreen>[0], 'list' | 'deletion' | 'rename'>> & {
    list?: Partial<AllTripsListProps>;
    deletion?: Partial<ThreadDeletionProps>;
    rename?: Partial<ThreadRenameProps>;
  } = {}
) => {
  const {
    list: listOverrides,
    deletion: deletionOverrides,
    rename: renameOverrides,
    ...rest
  } = props;
  const merged = {
    ...baseProps,
    ...rest,
    deletion: { ...baseDeletion, ...deletionOverrides },
    list: { ...baseList, ...listOverrides },
    rename: { ...baseRename, ...renameOverrides },
  };

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
  const { onBack, deletion } = await renderScreen();

  expect(screen.getByText('All trips')).toBeOnTheScreen();

  await user.press(screen.getByLabelText('Back'));
  expect(onBack).toHaveBeenCalledTimes(1);

  await user.press(screen.getByLabelText('Delete all trips'));
  expect(deletion.onDeleteAllTrips).toHaveBeenCalledTimes(1);
});

test('shows a loading indicator while loading', async () => {
  await renderScreen({ list: { status: 'loading' } });

  expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
});

test('shows an error state and retries on press', async () => {
  const user = userEvent.setup();
  const { list } = await renderScreen({ list: { status: 'error' } });

  expect(screen.getByText("Couldn't load your trips.")).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Retry' }));

  expect(list.onRetry).toHaveBeenCalledTimes(1);
});

test('shows a retry notice without hiding stale trips when sync fails', async () => {
  const user = userEvent.setup();
  const { list } = await renderScreen({
    list: {
      syncFailed: true,
      threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })],
    },
  });

  expect(screen.getByText("Couldn't refresh your trips.")).toBeOnTheScreen();
  expect(screen.getByText('Da Nang trip')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Retry' }));

  expect(list.onRetry).toHaveBeenCalledTimes(1);
});

test('shows an empty state when there are no trips', async () => {
  await renderScreen({ list: { status: 'ready', threads: [] } });

  expect(screen.getByText('Your trips will show up here.')).toBeOnTheScreen();
});

test('renders each trip under a date section, falling back to "Untitled trip"', async () => {
  await renderScreen({
    list: {
      status: 'ready',
      threads: [
        makeThread('1', 'Da Nang trip', { createdAt: today() }),
        makeThread('2', null, { createdAt: today() }),
      ],
    },
  });

  expect(screen.getByText('TODAY')).toBeOnTheScreen();
  expect(screen.getByText('Da Nang trip')).toBeOnTheScreen();
  expect(screen.getByText('Untitled trip')).toBeOnTheScreen();
});

test('shows each trip’s created time', async () => {
  const createdAt = today();
  await renderScreen({
    list: { status: 'ready', threads: [makeThread('1', 'Da Nang trip', { createdAt })] },
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
    list: { status: 'ready', threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })] },
  });

  await user.press(screen.getByText('Da Nang trip'));

  expect(onOpenThread).toHaveBeenCalledWith('1');
});

test('pressing delete removes the trip and disables its own button while deleting', async () => {
  const user = userEvent.setup();
  const { deletion } = await renderScreen({
    list: { status: 'ready', threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })] },
    deletion: { deletingThreadId: '1' },
  });

  expect(screen.getByLabelText('Delete trip')).toBeDisabled();

  await user.press(screen.getByLabelText('Delete trip'));

  expect(deletion.onDeleteThread).not.toHaveBeenCalled();
});

test('pressing delete on a non-busy trip calls onDeleteThread', async () => {
  const user = userEvent.setup();
  const busyThread = makeThread('1', 'Da Nang trip', { createdAt: today() });
  const { deletion } = await renderScreen({
    list: { status: 'ready', threads: [busyThread] },
    deletion: { deletingThreadId: null },
  });

  await user.press(screen.getByLabelText('Delete trip'));

  expect(deletion.onDeleteThread).toHaveBeenCalledWith(busyThread);
});

test('pressing rename opens the rename dialog for that trip', async () => {
  const user = userEvent.setup();
  const trip = makeThread('1', 'Da Nang trip', { createdAt: today() });
  const { rename } = await renderScreen({ list: { status: 'ready', threads: [trip] } });

  await user.press(screen.getByLabelText('Rename trip'));

  expect(rename.onStartRename).toHaveBeenCalledWith(trip);
});

test('rename dialog saves the new title and dismisses on cancel', async () => {
  const user = userEvent.setup();
  const trip = makeThread('1', 'Da Nang trip', { createdAt: today() });
  const { rename } = await renderScreen({
    list: { status: 'ready', threads: [trip] },
    rename: { renamingThread: trip },
  });

  const input = screen.getByDisplayValue('Da Nang trip');

  await user.clear(input);
  await user.type(input, 'Hoi An getaway');
  await user.press(screen.getByText('Save'));

  expect(rename.onConfirmRename).toHaveBeenCalledWith('Hoi An getaway');

  await user.press(screen.getByText('Cancel'));

  expect(rename.onCancelRename).toHaveBeenCalledTimes(1);
});

test('shows a retry affordance when loading more fails', async () => {
  const user = userEvent.setup();
  const { list } = await renderScreen({
    list: {
      status: 'ready',
      threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })],
      hasMore: true,
      loadMoreFailed: true,
    },
  });

  expect(screen.getByText("Couldn't load more trips.")).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Retry' }));

  expect(list.onLoadMore).toHaveBeenCalledTimes(1);
});

test('typing in the search bar filters trips by title', async () => {
  const user = userEvent.setup();
  await renderScreen({
    list: {
      status: 'ready',
      threads: [
        makeThread('1', 'Da Nang trip', { createdAt: today() }),
        makeThread('2', 'Hanoi trip', { createdAt: today() }),
      ],
    },
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
    list: { status: 'ready', threads: [makeThread('1', 'Da Nang trip', { createdAt: today() })] },
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
