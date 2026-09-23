import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement } from 'react';

import { useAllThreads } from '../useAllThreads';

jest.mock('../../services', () => ({
  fetchThreadsPage: jest.fn(),
}));

import { fetchThreadsPage } from '../../services';

import type { ThreadItem } from '../../services';

const makeThreads = (count: number, offset = 0): ThreadItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `thread-${offset + index}`,
    title: `Trip ${offset + index}`,
    createdAt: `2026-01-0${((offset + index) % 9) + 1}T00:00:00Z`,
  }));

const FULL_PAGE = 10;

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

afterEach(() => {
  queryClient.clear();
});

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

test('loads the first page and reports hasMore when the page is full', async () => {
  (fetchThreadsPage as jest.Mock).mockResolvedValue(makeThreads(FULL_PAGE));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });
  expect(result.current.threads).toHaveLength(FULL_PAGE);
  expect(result.current.hasMore).toBe(true);
  expect(fetchThreadsPage).toHaveBeenCalledWith(FULL_PAGE, 0);
});

test('reports no more pages when the page is short', async () => {
  (fetchThreadsPage as jest.Mock).mockResolvedValue(makeThreads(3));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });
  expect(result.current.hasMore).toBe(false);
});

test('sets error status when the initial fetch fails', async () => {
  (fetchThreadsPage as jest.Mock).mockRejectedValue(new Error('network down'));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('error');
  });
  expect(result.current.threads).toEqual([]);
});

test('fetchMore appends the next page and de-duplicates by id', async () => {
  (fetchThreadsPage as jest.Mock).mockResolvedValueOnce(makeThreads(FULL_PAGE));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });

  const overlappingPage = [...makeThreads(2, FULL_PAGE - 1), ...makeThreads(1, FULL_PAGE + 2)];
  (fetchThreadsPage as jest.Mock).mockResolvedValueOnce(overlappingPage);

  await act(async () => {
    result.current.fetchMore();
  });

  // React Query's notifyManager batches the re-render via setTimeout, so it can land
  // after this promise resolves — wait on the merged length itself, not a transient flag.
  await waitFor(() => {
    expect(result.current.threads).toHaveLength(FULL_PAGE + 2);
  });

  expect(fetchThreadsPage).toHaveBeenLastCalledWith(FULL_PAGE, FULL_PAGE);
  expect(result.current.hasMore).toBe(false);
});

test('fetchMore marks loadMoreFailed on rejection without clearing existing threads', async () => {
  (fetchThreadsPage as jest.Mock).mockResolvedValueOnce(makeThreads(FULL_PAGE));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });

  (fetchThreadsPage as jest.Mock).mockRejectedValueOnce(new Error('timeout'));

  await act(async () => {
    result.current.fetchMore();
  });

  await waitFor(() => {
    expect(result.current.loadMoreFailed).toBe(true);
  });
  expect(result.current.threads).toHaveLength(FULL_PAGE);
  expect(result.current.isLoadingMore).toBe(false);
});

test('fetchMore is a no-op when there is no more to load', async () => {
  (fetchThreadsPage as jest.Mock).mockResolvedValue(makeThreads(3));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });

  (fetchThreadsPage as jest.Mock).mockClear();
  await act(async () => {
    result.current.fetchMore();
  });

  expect(fetchThreadsPage).not.toHaveBeenCalled();
});

test('removeThread filters the thread out of local state', async () => {
  (fetchThreadsPage as jest.Mock).mockResolvedValue(makeThreads(3));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });

  await act(async () => {
    result.current.removeThread('thread-1');
  });

  await waitFor(() => {
    expect(result.current.threads.map((thread) => thread.id)).toEqual(['thread-0', 'thread-2']);
  });
});

test('renameThread updates the thread title in local state', async () => {
  (fetchThreadsPage as jest.Mock).mockResolvedValue(makeThreads(3));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });

  await act(async () => {
    result.current.renameThread('thread-1', 'Renamed trip');
  });

  await waitFor(() => {
    const renamed = result.current.threads.find((thread) => thread.id === 'thread-1');

    expect(renamed?.title).toBe('Renamed trip');
  });
});

test('refresh resets state to loading and re-fetches from the start', async () => {
  (fetchThreadsPage as jest.Mock).mockResolvedValue(makeThreads(3));

  const { result } = await renderHook(() => useAllThreads(), { wrapper });

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });

  (fetchThreadsPage as jest.Mock).mockClear();
  (fetchThreadsPage as jest.Mock).mockResolvedValue(makeThreads(1));

  await act(async () => {
    result.current.refresh();
  });

  await waitFor(() => {
    expect(result.current.threads).toHaveLength(1);
  });

  expect(fetchThreadsPage).toHaveBeenCalledWith(FULL_PAGE, 0);
});
