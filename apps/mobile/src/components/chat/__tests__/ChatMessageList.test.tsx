import { FlatList } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChatMessageList } from '../ChatMessageList';
import { CHAT_LIST_INITIAL_NUM_TO_RENDER, CHAT_LIST_WINDOW_SIZE } from '../../../constants';
import { ThemeProvider } from '../../../theme';
import { SAFE_AREA_INITIAL_METRICS } from '../../../test/fixtures';

import type { Message } from '@copilotkit/react-native/headless';
import type { ComponentProps } from 'react';
import type { SharedValue } from 'react-native-reanimated';

jest.mock('@copilotkit/react-native/headless', () => ({
  useRenderToolCall: () => () => null,
}));

type ListProps = ComponentProps<typeof ChatMessageList>;

const messages = [
  { id: 'u1', role: 'user', content: 'Plan a trip to Hue' },
  { id: 'a1', role: 'assistant', content: 'Sure, one moment.' },
] as Message[];

const baseProps: ListProps = {
  extraContentPadding: { value: 0 } as SharedValue<number>,
  hasNewer: false,
  hasOlder: true,
  interruptElement: null,
  isLoadingOlder: false,
  isRunning: false,
  messages,
  olderError: null,
  onLoadNewer: jest.fn(),
  onLoadOlder: jest.fn(),
  onRetryOlder: jest.fn(),
  onSuggestionPress: jest.fn(),
  suggestions: [],
};

const renderList = async (props: Partial<ListProps> = {}) => {
  const merged = { ...baseProps, ...props };
  const tree = (listProps: ListProps) => (
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
      <ThemeProvider>
        <ChatMessageList {...listProps} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
  const utils = await render(tree(merged));

  return {
    ...merged,
    rerender: (next: Partial<ListProps>) => utils.rerender(tree({ ...merged, ...next })),
  };
};

const scrollTo = (y: number) =>
  fireEvent.scroll(screen.getByTestId('chat-message-list'), {
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentSize: { height: 2000, width: 400 },
      layoutMeasurement: { height: 800, width: 400 },
    },
  });

const list = () => screen.getByTestId('chat-message-list');
const dragList = () => fireEvent(list(), 'scrollBeginDrag', { nativeEvent: {} });
const growContent = (height: number) => fireEvent(list(), 'contentSizeChange', 400, height);

beforeEach(() => {
  jest.clearAllMocks();
});

test('keeps scrolling to the newest message while the opened thread lays out', async () => {
  const scrollToEnd = jest.spyOn(FlatList.prototype, 'scrollToEnd').mockImplementation(() => {});
  await renderList();
  scrollToEnd.mockClear();

  await growContent(1200);
  await growContent(2400);

  expect(scrollToEnd).toHaveBeenCalledTimes(2);
  expect(scrollToEnd).toHaveBeenLastCalledWith({ animated: false });
  scrollToEnd.mockRestore();
});

test('stops forcing the initial scroll once the user drags the list', async () => {
  const scrollToEnd = jest.spyOn(FlatList.prototype, 'scrollToEnd').mockImplementation(() => {});
  await renderList();
  await dragList();
  scrollToEnd.mockClear();

  await growContent(3000);

  expect(scrollToEnd).not.toHaveBeenCalledWith({ animated: false });
  scrollToEnd.mockRestore();
});

test('scrolls to reveal suggestions that arrive while the user is at the bottom', async () => {
  const scrollToEnd = jest.spyOn(FlatList.prototype, 'scrollToEnd').mockImplementation(() => {});
  const { rerender } = await renderList();
  scrollToEnd.mockClear();

  await rerender({
    suggestions: [{ isLoading: false, message: 'Show hotels', title: 'Find hotels' }],
  });

  expect(screen.getByText('Find hotels')).toBeOnTheScreen();
  expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  scrollToEnd.mockRestore();
});

test('does not load older messages from the initial top position before the user scrolls', async () => {
  const { onLoadOlder } = await renderList();

  await scrollTo(0);

  expect(onLoadOlder).not.toHaveBeenCalled();
});

test('requests older messages once for repeated near-top scroll events', async () => {
  const { onLoadOlder } = await renderList();

  await dragList();
  await scrollTo(10);
  await scrollTo(5);
  await scrollTo(0);

  expect(onLoadOlder).toHaveBeenCalledTimes(1);
});

test('does not request older messages while a page is loading', async () => {
  const { onLoadOlder } = await renderList({ isLoadingOlder: true });

  await scrollTo(0);
  await scrollTo(0);

  expect(onLoadOlder).not.toHaveBeenCalled();
});

test('does not request older messages when the archive is exhausted', async () => {
  const { onLoadOlder } = await renderList({ hasOlder: false });

  await scrollTo(0);

  expect(onLoadOlder).not.toHaveBeenCalled();
});

test('requests the next older page after the previous one finishes', async () => {
  const { onLoadOlder, rerender } = await renderList();

  await dragList();
  await scrollTo(0);
  await rerender({ isLoadingOlder: true });
  await rerender({ isLoadingOlder: false });
  await scrollTo(0);

  expect(onLoadOlder).toHaveBeenCalledTimes(2);
});

test('ignores scroll events away from the top', async () => {
  const { onLoadOlder } = await renderList();

  await scrollTo(600);

  expect(onLoadOlder).not.toHaveBeenCalled();
});

test('keeps the older-history header above the first message', async () => {
  await renderList({ isLoadingOlder: true });

  expect(screen.getByLabelText('Loading older messages')).toBeOnTheScreen();
  expect(screen.getByText('Plan a trip to Hue')).toBeOnTheScreen();
});

test('requests the evicted newer page when the end of the list is reached', async () => {
  const { onLoadNewer } = await renderList({ hasNewer: true });

  await fireEvent(screen.getByTestId('chat-message-list'), 'endReached', { distanceFromEnd: 0 });

  expect(onLoadNewer).toHaveBeenCalledTimes(1);
});

test('does not request a newer page when the newest page is resident', async () => {
  const { onLoadNewer } = await renderList({ hasNewer: false });

  await fireEvent(screen.getByTestId('chat-message-list'), 'endReached', { distanceFromEnd: 0 });

  expect(onLoadNewer).not.toHaveBeenCalled();
});

test('mounts a bounded number of rows for a 500-message thread', async () => {
  const many = Array.from({ length: 500 }, (_, index) => ({
    id: `m${index}`,
    role: index % 2 ? 'assistant' : 'user',
    content: `Message ${index}`,
  })) as Message[];

  await renderList({ messages: many });

  expect(screen.queryAllByText(/^Message \d+$/).length).toBeLessThanOrEqual(
    CHAT_LIST_INITIAL_NUM_TO_RENDER
  );
});

test('uses a small render window to limit native memory', async () => {
  let windowSize: number | null | undefined;
  const originalRender = FlatList.prototype.render;
  const renderSpy = jest.spyOn(FlatList.prototype, 'render').mockImplementation(function (
    this: FlatList<unknown>
  ) {
    windowSize = this.props.windowSize;
    return originalRender.call(this);
  });

  await renderList();

  expect(windowSize).toBe(CHAT_LIST_WINDOW_SIZE);
  renderSpy.mockRestore();
});
