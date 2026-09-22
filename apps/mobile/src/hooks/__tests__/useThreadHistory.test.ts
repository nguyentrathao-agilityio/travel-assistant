import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { createElement } from 'react';

import { useThreadHistory } from '../useThreadHistory';

jest.mock('../../services/threadHistory', () => ({
  fetchThreadValues: jest.fn(),
}));

const mockToAgUiMessage = jest.fn();

jest.mock('../../utils/langgraphMessage', () => ({
  toAgUiMessage: (message: unknown, fallbackId: string) => mockToAgUiMessage(message, fallbackId),
}));

import { fetchThreadValues } from '../../services/threadHistory';

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

afterEach(() => {
  queryClient.clear();
});

beforeEach(() => {
  (fetchThreadValues as jest.Mock).mockReset();
  mockToAgUiMessage.mockReset();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

test('returns empty, non-loading state when threadId is empty', async () => {
  const { result } = await renderHook(() => useThreadHistory(''), { wrapper });

  expect(result.current).toEqual({ messages: [], isLoading: false });
  expect(fetchThreadValues).not.toHaveBeenCalled();
});

test('starts loading once a threadId is provided', async () => {
  (fetchThreadValues as jest.Mock).mockReturnValue(new Promise(() => {}));

  const { result } = await renderHook(() => useThreadHistory('thread-1'), { wrapper });

  expect(result.current.isLoading).toBe(true);
  expect(result.current.messages).toEqual([]);
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

  const { result } = await renderHook(() => useThreadHistory('thread-1'), { wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.messages).toEqual([{ id: 'r1', role: 'user', content: 'hi' }]);
  expect(mockToAgUiMessage).toHaveBeenCalledWith(rawMessages[0], 'thread-1:0');
  expect(mockToAgUiMessage).toHaveBeenCalledWith(rawMessages[1], 'thread-1:1');
});

test('falls back to an empty conversation when the thread values have no messages', async () => {
  (fetchThreadValues as jest.Mock).mockResolvedValue({});

  const { result } = await renderHook(() => useThreadHistory('thread-1'), { wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.messages).toEqual([]);
});

test('resolves to an empty conversation when the fetch rejects', async () => {
  (fetchThreadValues as jest.Mock).mockRejectedValue(new Error('not found'));

  const { result } = await renderHook(() => useThreadHistory('thread-1'), { wrapper });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.messages).toEqual([]);
});

test('re-fetches when threadId changes', async () => {
  (fetchThreadValues as jest.Mock).mockResolvedValue({ messages: [] });

  const { rerender } = await renderHook(
    ({ threadId }: { threadId: string }) => useThreadHistory(threadId),
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
