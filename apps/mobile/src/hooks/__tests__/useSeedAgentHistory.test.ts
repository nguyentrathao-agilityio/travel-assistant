import { renderHook } from '@testing-library/react-native';

import { useSeedAgentHistory } from '../useSeedAgentHistory';

import type { Message } from '@copilotkit/react-native/headless';

const mockSetMessages = jest.fn();
const mockMessages = jest.fn((): Message[] => []);
const mockAgent = {
  get messages() {
    return mockMessages();
  },
  setMessages: mockSetMessages,
};

jest.mock('@copilotkit/react-native/headless', () => ({
  useAgent: () => ({ agent: mockAgent }),
}));

const persisted: Message[] = [
  { id: 'm1', role: 'user', content: 'Show me places to visit in Da Nang' },
  { id: 'm2', role: 'assistant', content: 'Here are some options...' },
];

beforeEach(() => {
  mockSetMessages.mockClear();
  mockMessages.mockReturnValue([]);
});

test('does not seed while history is still loading', async () => {
  await renderHook(() => useSeedAgentHistory('thread-1', persisted, true));

  expect(mockSetMessages).not.toHaveBeenCalled();
});

test('does not seed when threadId is empty', async () => {
  await renderHook(() => useSeedAgentHistory('', persisted, false));

  expect(mockSetMessages).not.toHaveBeenCalled();
});

test('seeds the live agent state once history finishes loading and live messages are empty', async () => {
  await renderHook(() => useSeedAgentHistory('thread-1', persisted, false));

  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(mockSetMessages).toHaveBeenCalledWith(persisted);
  expect(mockSetMessages).toHaveBeenCalledTimes(1);
});

test('does not seed when there is no persisted history to seed with', async () => {
  await renderHook(() => useSeedAgentHistory('thread-1', [], false));

  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(mockSetMessages).not.toHaveBeenCalled();
});

test('resets stale live messages when a new thread becomes active', async () => {
  mockMessages.mockReturnValue([{ id: 'live-1', role: 'user', content: 'hello' }]);

  await renderHook(() => useSeedAgentHistory('thread-1', persisted, false));

  expect(mockSetMessages).toHaveBeenCalledWith([]);
});

test('does not overwrite a conversation already in progress in this session', async () => {
  const { rerender } = await renderHook(
    ({ threadId }: { threadId: string }) => useSeedAgentHistory(threadId, persisted, false),
    { initialProps: { threadId: 'thread-1' } }
  );

  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mockSetMessages).toHaveBeenCalledTimes(1);

  mockSetMessages.mockClear();
  mockMessages.mockReturnValue([{ id: 'live-1', role: 'user', content: 'hello' }]);
  await rerender({ threadId: 'thread-1' });
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(mockSetMessages).not.toHaveBeenCalled();
});

test('only seeds once per thread, even across re-renders', async () => {
  const { rerender } = await renderHook(
    ({ threadId }: { threadId: string }) => useSeedAgentHistory(threadId, persisted, false),
    { initialProps: { threadId: 'thread-1' } }
  );

  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mockSetMessages).toHaveBeenCalledTimes(1);

  await rerender({ threadId: 'thread-1' });
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(mockSetMessages).toHaveBeenCalledTimes(1);
});

test('seeds again after switching to a different thread', async () => {
  const { rerender } = await renderHook(
    ({ threadId }: { threadId: string }) => useSeedAgentHistory(threadId, persisted, false),
    { initialProps: { threadId: 'thread-1' } }
  );

  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mockSetMessages).toHaveBeenCalledTimes(1);

  await rerender({ threadId: 'thread-2' });
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(mockSetMessages).toHaveBeenCalledTimes(2);
});
