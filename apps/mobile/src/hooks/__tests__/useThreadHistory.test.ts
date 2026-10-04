import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement } from 'react';

import { useAgentThreadHistory } from '../useAgentThreadHistory';

import type { Message } from '@copilotkit/react-native/headless';

const mockAgentMessages: Message[] = [];
const mockSetMessages = jest.fn((messages: Message[]) => {
  mockAgentMessages.splice(0, mockAgentMessages.length, ...messages);
});

jest.mock('@copilotkit/react-native/headless', () => ({
  useAgent: () => ({ agent: { messages: mockAgentMessages, setMessages: mockSetMessages } }),
}));

jest.mock('../../services/threadHistory', () => ({
  fetchThreadValues: jest.fn(),
}));

const mockToAgUiMessage = jest.fn();

jest.mock('../../utils/langgraphMessage', () => ({
  toAgUiMessages: (threadId: string, values?: { messages?: unknown[] }) =>
    (values?.messages ?? []).flatMap((message, index) => {
      const converted = mockToAgUiMessage(message, `${threadId}:${index}`);

      return converted ? [converted] : [];
    }),
}));

import { fetchThreadValues } from '../../services/threadHistory';

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

afterEach(() => {
  queryClient.clear();
});

beforeEach(() => {
  (fetchThreadValues as jest.Mock).mockReset();
  mockToAgUiMessage.mockReset();
  mockSetMessages.mockClear();
  mockAgentMessages.length = 0;
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

test('returns empty, non-loading state when threadId is empty', async () => {
  const { result } = await renderHook(() => useAgentThreadHistory(''), { wrapper });

  expect(result.current).toEqual({
    messages: [],
    isLoading: false,
    reloadThread: expect.any(Function),
  });
  expect(fetchThreadValues).not.toHaveBeenCalled();
});

test('starts loading once a threadId is provided', async () => {
  const request = createDeferred<Record<string, never>>();
  (fetchThreadValues as jest.Mock).mockReturnValue(request.promise);

  const { result } = await renderHook(() => useAgentThreadHistory('thread-1'), { wrapper });

  expect(result.current.isLoading).toBe(true);
  expect(result.current.messages).toEqual([]);

  await act(async () => request.resolve({}));
});

test('clears stale live messages when a thread becomes active', async () => {
  mockAgentMessages.push({ id: 'live-1', role: 'user', content: 'stale' });
  const request = createDeferred<Record<string, never>>();
  (fetchThreadValues as jest.Mock).mockReturnValue(request.promise);

  await renderHook(() => useAgentThreadHistory('thread-1'), { wrapper });

  expect(mockSetMessages).toHaveBeenCalledWith([]);

  await act(async () => request.resolve({}));
});

test('converts raw messages via toAgUiMessage and drops nulls', async () => {
  const rawMessages = [
    { id: 'r1', type: 'human' },
    { id: 'r2', type: 'system' },
  ];

  (fetchThreadValues as jest.Mock).mockResolvedValue({ messages: rawMessages });
  mockToAgUiMessage.mockImplementation((message: { id: string }) =>
    message.id === 'r1' ? { id: 'r1', role: 'user', content: 'hi' } : null
  );

  const { result } = await renderHook(() => useAgentThreadHistory('thread-1'), { wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.messages).toEqual([{ id: 'r1', role: 'user', content: 'hi' }]);
  expect(mockToAgUiMessage).toHaveBeenCalledWith(rawMessages[0], 'thread-1:0');
  expect(mockToAgUiMessage).toHaveBeenCalledWith(rawMessages[1], 'thread-1:1');
  expect(mockSetMessages).toHaveBeenCalledWith([{ id: 'r1', role: 'user', content: 'hi' }]);
});

test('falls back to an empty conversation when the thread values have no messages', async () => {
  (fetchThreadValues as jest.Mock).mockResolvedValue({});

  const { result } = await renderHook(() => useAgentThreadHistory('thread-1'), { wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.messages).toEqual([]);
});

test('resolves to an empty conversation when the fetch rejects', async () => {
  (fetchThreadValues as jest.Mock).mockRejectedValue(new Error('not found'));

  const { result } = await renderHook(() => useAgentThreadHistory('thread-1'), { wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.messages).toEqual([]);
});

test('re-fetches when threadId changes', async () => {
  (fetchThreadValues as jest.Mock).mockResolvedValue({ messages: [] });

  const { rerender } = await renderHook(
    ({ threadId }: { threadId: string }) => useAgentThreadHistory(threadId),
    {
      initialProps: { threadId: 'thread-1' },
      wrapper,
    }
  );

  await waitFor(() => {
    expect(fetchThreadValues).toHaveBeenCalledWith('thread-1');
  });

  await rerender({ threadId: 'thread-2' });

  await waitFor(() => {
    expect(fetchThreadValues).toHaveBeenCalledWith('thread-2');
  });
});

test('does not overwrite live messages added after history was seeded', async () => {
  (fetchThreadValues as jest.Mock).mockResolvedValue({ messages: [{ id: 'r1' }] });
  mockToAgUiMessage.mockReturnValue({ id: 'r1', role: 'user', content: 'persisted' });

  const { rerender } = await renderHook(() => useAgentThreadHistory('thread-1'), { wrapper });

  await waitFor(() => expect(mockSetMessages).toHaveBeenCalledTimes(1));
  mockSetMessages.mockClear();
  mockAgentMessages.splice(0, mockAgentMessages.length, {
    id: 'live-1',
    role: 'user',
    content: 'live',
  });

  await rerender(undefined);

  expect(mockSetMessages).not.toHaveBeenCalled();
});

test('seeds persisted history only once for the same thread', async () => {
  (fetchThreadValues as jest.Mock).mockResolvedValue({ messages: [{ id: 'r1' }] });
  mockToAgUiMessage.mockReturnValue({ id: 'r1', role: 'user', content: 'persisted' });

  const { rerender } = await renderHook(() => useAgentThreadHistory('thread-1'), { wrapper });

  await waitFor(() => expect(mockSetMessages).toHaveBeenCalledTimes(1));
  await rerender(undefined);

  expect(mockSetMessages).toHaveBeenCalledTimes(1);
});

test('clears and seeds history again after switching threads', async () => {
  (fetchThreadValues as jest.Mock).mockImplementation((threadId: string) => ({
    messages: [{ id: `${threadId}-message` }],
  }));
  mockToAgUiMessage.mockImplementation((message: { id: string }) => ({
    id: message.id,
    role: 'user',
    content: message.id,
  }));

  const { rerender } = await renderHook(
    ({ threadId }: { threadId: string }) => useAgentThreadHistory(threadId),
    { initialProps: { threadId: 'thread-1' }, wrapper }
  );

  await waitFor(() => expect(mockAgentMessages[0]?.id).toBe('thread-1-message'));
  await rerender({ threadId: 'thread-2' });

  await waitFor(() => expect(mockAgentMessages[0]?.id).toBe('thread-2-message'));
  expect(mockSetMessages).toHaveBeenCalledWith([]);
});

test('reloadThread replaces live messages with the server thread', async () => {
  (fetchThreadValues as jest.Mock).mockResolvedValue({
    messages: [
      { type: 'human', id: 'h1', content: 'hi' },
      { type: 'ai', id: 'a1', content: 'Hello' },
    ],
  });
  mockToAgUiMessage.mockImplementation(
    (message: { id: string; type: string; content: string }) => ({
      content: message.content,
      id: message.id,
      role: message.type === 'human' ? 'user' : 'assistant',
    })
  );
  const { result } = await renderHook(() => useAgentThreadHistory('thread-1'), { wrapper });

  await act(async () => result.current.reloadThread());

  expect(mockSetMessages).toHaveBeenLastCalledWith([
    expect.objectContaining({ id: 'h1', role: 'user' }),
    expect.objectContaining({ id: 'a1', role: 'assistant' }),
  ]);
});
