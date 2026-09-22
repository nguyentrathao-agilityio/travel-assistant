import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement } from 'react';

import { useRecentThreads } from '../useRecentThreads';

jest.mock('../../services', () => ({
  fetchRecentThreads: jest.fn(),
}));

import { fetchRecentThreads } from '../../services';

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

afterEach(() => {
  queryClient.clear();
});

beforeEach(() => {
  (fetchRecentThreads as jest.Mock).mockReset();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

test('starts in a loading state', async () => {
  (fetchRecentThreads as jest.Mock).mockReturnValue(new Promise(() => {}));

  const { result } = await renderHook(() => useRecentThreads(), { wrapper });

  expect(result.current.status).toBe('loading');
  expect(result.current.threads).toEqual([]);
});

test('resolves to ready with the fetched threads', async () => {
  const threads = [{ id: 't1', title: 'Trip to Hanoi', createdAt: '2026-09-01T00:00:00Z' }];

  (fetchRecentThreads as jest.Mock).mockResolvedValue(threads);

  const { result } = await renderHook(() => useRecentThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });
  expect(result.current.threads).toEqual(threads);
});

test('passes the limit through to the service', async () => {
  (fetchRecentThreads as jest.Mock).mockResolvedValue([]);

  await renderHook(() => useRecentThreads(10), { wrapper });

  expect(fetchRecentThreads).toHaveBeenCalledWith(10);
});

test('resolves to error status when the fetch rejects', async () => {
  (fetchRecentThreads as jest.Mock).mockRejectedValue(new Error('network down'));

  const { result } = await renderHook(() => useRecentThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('error');
  });
  expect(result.current.threads).toEqual([]);
});

test('refresh re-fetches and resets to loading first', async () => {
  (fetchRecentThreads as jest.Mock).mockResolvedValue([]);

  const { result } = await renderHook(() => useRecentThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });

  const nextThreads = [{ id: 't2', title: 'Trip to Da Nang', createdAt: '2026-09-02T00:00:00Z' }];

  (fetchRecentThreads as jest.Mock).mockResolvedValue(nextThreads);

  await act(async () => {
    result.current.refresh();
  });

  await waitFor(() => {
    expect(result.current.threads).toEqual(nextThreads);
  });
  expect(fetchRecentThreads).toHaveBeenCalledTimes(2);
});

test('removeThread drops a thread from the ready list immediately', async () => {
  const threads = [
    { id: 't1', title: 'Trip to Hanoi', createdAt: '2026-09-01T00:00:00Z' },
    { id: 't2', title: 'Trip to Da Nang', createdAt: '2026-09-02T00:00:00Z' },
  ];

  (fetchRecentThreads as jest.Mock).mockResolvedValue(threads);

  const { result } = await renderHook(() => useRecentThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });

  await act(async () => {
    result.current.removeThread('t1');
  });

  await waitFor(() => {
    expect(result.current.threads).toEqual([threads[1]]);
  });
});

test('removeThread is a no-op while still loading', async () => {
  (fetchRecentThreads as jest.Mock).mockReturnValue(new Promise(() => {}));

  const { result } = await renderHook(() => useRecentThreads(), { wrapper });

  await act(async () => {
    result.current.removeThread('t1');
  });

  expect(result.current.status).toBe('loading');
  expect(result.current.threads).toEqual([]);
});
