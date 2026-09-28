import { createRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { ChatMessageList } from '../ChatMessageList';
import { CHAT_LIST_INITIAL_NUM_TO_RENDER, CHAT_LIST_WINDOW_SIZE } from '../../../constants';
import { ThemeProvider } from '../../../theme';
import { SAFE_AREA_INITIAL_METRICS } from '../../../test/fixtures';

import type { ChatMessageListHandle } from '../ChatMessageList';
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

const renderList = async (
  props: Partial<ListProps> = {},
  ref?: React.Ref<ChatMessageListHandle>
) => {
  const merged = { ...baseProps, ...props };

  await render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
      <ThemeProvider>
        <ChatMessageList ref={ref} {...merged} />
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return merged;
};

// Captures the props FlatList renders with (FlatList is a class component).
const captureFlatListProps = () => {
  const captured: { props?: FlatList<unknown>['props'] } = {};
  const originalRender = FlatList.prototype.render;
  const spy = jest.spyOn(FlatList.prototype, 'render').mockImplementation(function (
    this: FlatList<unknown>
  ) {
    captured.props = this.props;
    return originalRender.call(this);
  });

  return { captured, restore: () => spy.mockRestore() };
};

const list = () => screen.getByTestId('chat-message-list');

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders an inverted list with the newest message first, so a thread opens at its latest message', async () => {
  const { captured, restore } = captureFlatListProps();

  await renderList();

  expect(captured.props?.inverted).toBe(true);
  expect((captured.props?.data as { id: string }[]).map((row) => row.id)).toEqual(['a1', 'u1']);
  restore();
});

test('keeps a short new chat aligned to the top like a normal list', async () => {
  const { captured } = captureFlatListProps();

  await renderList();

  // In an inverted list flex-end is the visual top, so short conversations start at the top.
  expect(StyleSheet.flatten(captured.props?.contentContainerStyle)).toMatchObject({
    flexGrow: 1,
    justifyContent: 'flex-end',
  });
});

test('does not rely on maintainVisibleContentPosition or scrollToEnd', async () => {
  const { captured, restore } = captureFlatListProps();
  const scrollToEnd = jest.spyOn(FlatList.prototype, 'scrollToEnd').mockImplementation(() => {});

  await renderList();
  await fireEvent(list(), 'contentSizeChange', 400, 2400);

  expect(captured.props?.maintainVisibleContentPosition).toBeUndefined();
  expect(scrollToEnd).not.toHaveBeenCalled();
  scrollToEnd.mockRestore();
  restore();
});

test('scrollToLatest scrolls the inverted list back to offset 0', async () => {
  const scrollToOffset = jest
    .spyOn(FlatList.prototype, 'scrollToOffset')
    .mockImplementation(() => {});
  const ref = createRef<ChatMessageListHandle>();

  await renderList({}, ref);
  ref.current?.scrollToLatest();

  expect(scrollToOffset).toHaveBeenCalledWith({ animated: true, offset: 0 });
  scrollToOffset.mockRestore();
});

test('requests older messages when the top of the conversation is reached', async () => {
  const { onLoadOlder } = await renderList();

  await fireEvent(list(), 'endReached', { distanceFromEnd: 0 });

  expect(onLoadOlder).toHaveBeenCalledTimes(1);
});

test.each([
  ['a page is already loading', { isLoadingOlder: true }],
  ['the archive is exhausted', { hasOlder: false }],
  ['the last older page failed', { olderError: 'Could not load older messages.' }],
])('does not request older messages when %s', async (_case, props) => {
  const { onLoadOlder } = await renderList(props);

  await fireEvent(list(), 'endReached', { distanceFromEnd: 0 });

  expect(onLoadOlder).not.toHaveBeenCalled();
});

test('requests the evicted newest page when the bottom of the conversation is reached', async () => {
  const { onLoadNewer } = await renderList({ hasNewer: true });

  await fireEvent(list(), 'startReached', { distanceFromStart: 0 });

  expect(onLoadNewer).toHaveBeenCalledTimes(1);
});

test('does not request a newer page when the newest page is resident', async () => {
  const { onLoadNewer } = await renderList({ hasNewer: false });

  await fireEvent(list(), 'startReached', { distanceFromStart: 0 });

  expect(onLoadNewer).not.toHaveBeenCalled();
});

test('shows the older-history spinner and retry in the list footer (the visual top)', async () => {
  const { captured, restore } = captureFlatListProps();

  await renderList({ isLoadingOlder: true });

  expect(screen.getByLabelText('Loading older messages')).toBeOnTheScreen();
  expect(captured.props?.ListFooterComponent).toBeTruthy();
  restore();
});

test('retries a failed older page from the top of the conversation', async () => {
  const user = userEvent.setup();
  const { onRetryOlder } = await renderList({ olderError: 'Could not load older messages.' });

  await user.press(screen.getByRole('button', { name: 'Retry loading older messages' }));

  expect(onRetryOlder).toHaveBeenCalledTimes(1);
});

test('shows suggestions below the latest message without needing a scroll', async () => {
  await renderList({
    suggestions: [{ isLoading: false, message: 'Show hotels', title: 'Find hotels' }],
  });

  expect(screen.getByText('Find hotels')).toBeOnTheScreen();
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
  expect(screen.getByText('Message 499')).toBeOnTheScreen();
});

test('uses a small render window to limit native memory', async () => {
  const { captured, restore } = captureFlatListProps();

  await renderList();

  expect(captured.props?.windowSize).toBe(CHAT_LIST_WINDOW_SIZE);
  restore();
});
