import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement } from 'react';

import { SUMMARY_MESSAGE_PREFIX } from '@repo/constants';

import { shouldRetryTranscript, useTranscriptHistory } from '../useTranscriptHistory';

jest.mock('../../services', () => {
  const actual = jest.requireActual('../../services/transcript');

  return {
    fetchTranscriptPage: jest.fn(),
    isTransientTranscriptError: actual.isTransientTranscriptError,
    TranscriptRequestError: actual.TranscriptRequestError,
  };
});

import { TranscriptRequestError, fetchTranscriptPage } from '../../services';

import type { Message } from '@copilotkit/react-native/headless';
import type { TranscriptPage } from '@repo/schemas';

const PAGE_COUNT = 6;

// Page 0 is the newest; page N's previousCursor is `c${N + 1}`.
const transcriptPage = (index: number): TranscriptPage => {
  const hasPreviousPage = index < PAGE_COUNT - 1;

  return {
    messages: [
      { id: `p${index}-user`, role: 'user', content: `Question ${index}` },
      { id: `p${index}-assistant`, role: 'assistant', content: `Answer ${index}` },
    ],
    previousCursor: hasPreviousPage ? `c${index + 1}` : null,
    hasPreviousPage,
  };
};

const pageIndexFor = (cursor: string | null): number => (cursor ? Number(cursor.slice(1)) : 0);

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

const renderTranscriptHook = (threadId: string, liveMessages: Message[] = []) =>
  renderHook(() => useTranscriptHistory(threadId, liveMessages, false), { wrapper });

interface LiveProps {
  live: Message[];
  running: boolean;
}

const renderLiveHook = (initialProps: LiveProps) =>
  renderHook(({ live, running }: LiveProps) => useTranscriptHistory('thread-1', live, running), {
    initialProps,
    wrapper,
  });

type HookResult = Awaited<ReturnType<typeof renderTranscriptHook>>['result'];

const loadOlder = async (result: HookResult, expectedFirstId: string) => {
  await act(async () => {
    result.current.fetchOlder();
  });
  await waitFor(() => {
    expect(result.current.isLoadingOlder).toBe(false);
    expect(result.current.messages[0]?.id).toBe(expectedFirstId);
  });
};

const ids = (messages: Message[]) => messages.map((message) => message.id);

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (fetchTranscriptPage as jest.Mock).mockImplementation(async (_threadId, cursor) =>
    transcriptPage(pageIndexFor(cursor))
  );
});

afterEach(async () => {
  await act(async () => {
    queryClient.clear();
  });
  jest.clearAllMocks();
});

test('loads the newest page first and converts it to chat messages', async () => {
  const { result } = await renderTranscriptHook('thread-1');

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(fetchTranscriptPage).toHaveBeenCalledWith('thread-1', null);
  expect(result.current.messages).toEqual([
    { id: 'p0-user', role: 'user', content: 'Question 0' },
    { id: 'p0-assistant', role: 'assistant', content: 'Answer 0' },
  ]);
  expect(result.current.hasOlder).toBe(true);
});

test('prepends the older page requested with the previous cursor', async () => {
  const { result } = await renderTranscriptHook('thread-1');
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  await loadOlder(result, 'p1-user');

  expect(result.current.pageCount).toBe(2);
  expect(fetchTranscriptPage).toHaveBeenLastCalledWith('thread-1', 'c1');
  expect(ids(result.current.messages)).toEqual([
    'p1-user',
    'p1-assistant',
    'p0-user',
    'p0-assistant',
  ]);
});

test('keeps at most three pages and can recover an evicted cursor', async () => {
  const { result } = await renderTranscriptHook('thread-1');
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  await loadOlder(result, 'p1-user');
  await loadOlder(result, 'p2-user');
  await loadOlder(result, 'p3-user');
  await loadOlder(result, 'p4-user');

  expect(result.current.pageCount).toBe(3);
  expect(result.current.hasOlder).toBe(true);
  expect(result.current.hasNewer).toBe(true);
  expect(ids(result.current.messages)[0]).toBe('p4-user');

  await act(async () => {
    result.current.fetchNewer();
  });
  await waitFor(() => expect(ids(result.current.messages).at(-1)).toBe('p1-assistant'));
  expect(fetchTranscriptPage).toHaveBeenLastCalledWith('thread-1', 'c1');

  await act(async () => {
    result.current.fetchNewer();
  });
  await waitFor(() => expect(ids(result.current.messages).at(-1)).toBe('p0-assistant'));
  expect(fetchTranscriptPage).toHaveBeenLastCalledWith('thread-1', null);
  expect(result.current.hasNewer).toBe(false);
});

test('issues one older-page request while a request is pending', async () => {
  const { result } = await renderTranscriptHook('thread-1');
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  await act(async () => {
    result.current.fetchOlder();
    result.current.fetchOlder();
    result.current.fetchOlder();
  });
  await waitFor(() => expect(result.current.pageCount).toBe(2));

  expect(fetchTranscriptPage).toHaveBeenCalledTimes(2);
});

test('keeps loaded messages and exposes a retry when an older page fails', async () => {
  const { result } = await renderTranscriptHook('thread-1');
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  (fetchTranscriptPage as jest.Mock).mockRejectedValueOnce(new TranscriptRequestError(400));
  await act(async () => {
    result.current.fetchOlder();
  });
  await waitFor(() => expect(result.current.olderError).not.toBeNull());
  expect(ids(result.current.messages)).toEqual(['p0-user', 'p0-assistant']);

  await act(async () => {
    result.current.retryOlder();
  });
  await waitFor(() => expect(result.current.pageCount).toBe(2));
  expect(result.current.olderError).toBeNull();
});

test('overlays live messages on the archive by stable ID', async () => {
  const live: Message[] = [
    { id: 'p0-assistant', role: 'assistant', content: 'Answer 0 (live)' },
    { id: 'live-user', role: 'user', content: 'Follow-up' },
  ];
  const { result } = await renderTranscriptHook('thread-1', live);
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  expect(result.current.messages).toEqual([
    { id: 'p0-user', role: 'user', content: 'Question 0' },
    { id: 'p0-assistant', role: 'assistant', content: 'Answer 0 (live)' },
    { id: 'live-user', role: 'user', content: 'Follow-up' },
  ]);
});

test('never renders the context summary appended by the end-of-run snapshot', async () => {
  const live: Message[] = [
    { id: 'p0-assistant', role: 'assistant', content: 'Answer 0' },
    { id: 'summary', role: 'user', content: `${SUMMARY_MESSAGE_PREFIX}\n\nEarlier...` },
  ];
  const { result } = await renderTranscriptHook('thread-1', live);
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  expect(ids(result.current.messages)).toEqual(['p0-user', 'p0-assistant']);
});

test('keeps messages the end-of-run snapshot compacted away until the archive has them', async () => {
  const before: Message[] = [
    { id: 'live-1', role: 'user', content: 'Old question' },
    { id: 'live-2', role: 'assistant', content: 'Old answer' },
    { id: 'live-3', role: 'user', content: 'New question' },
  ];
  const { result, rerender } = await renderLiveHook({ live: before, running: true });
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  await rerender({ live: [before[2]], running: true });

  expect(ids(result.current.messages)).toEqual([
    'p0-user',
    'p0-assistant',
    'live-1',
    'live-2',
    'live-3',
  ]);
});

test('keeps compacted messages even when the remaining live messages are already archived', async () => {
  const before: Message[] = [
    { id: 'live-1', role: 'user', content: 'Session question' },
    { id: 'p0-assistant', role: 'assistant', content: 'Answer 0' },
  ];
  const { result, rerender } = await renderLiveHook({ live: before, running: true });
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  await rerender({ live: [before[1]], running: true });

  expect(ids(result.current.messages)).toContain('live-1');
});

test("does not carry another thread's live messages over when they are cleared outside a run", async () => {
  const previousThread: Message[] = [
    { id: 'other-thread-user', role: 'user', content: 'Question from another thread' },
  ];
  const { result, rerender } = await renderLiveHook({ live: previousThread, running: false });
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  await rerender({ live: [], running: false });

  expect(ids(result.current.messages)).toEqual(['p0-user', 'p0-assistant']);
});

test('refetches the resident transcript pages when a run finishes', async () => {
  const { result, rerender } = await renderLiveHook({ live: [], running: true });
  await waitFor(() => expect(result.current.pageCount).toBe(1));
  await loadOlder(result, 'p1-user');
  (fetchTranscriptPage as jest.Mock).mockClear();

  await rerender({ live: [], running: false });

  await waitFor(() => expect(fetchTranscriptPage).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(ids(result.current.messages)).toEqual([
    'p1-user',
    'p1-assistant',
    'p0-user',
    'p0-assistant',
  ]);
});

test('drops retained messages once the refreshed archive contains them', async () => {
  const oldQuestion: Message = { id: 'live-1', role: 'user', content: 'Old question' };
  const refreshedNewest: TranscriptPage = {
    ...transcriptPage(0),
    messages: [
      ...transcriptPage(0).messages,
      { id: 'live-1', role: 'user', content: 'Old question' },
    ],
  };
  const { result, rerender } = await renderLiveHook({ live: [oldQuestion], running: true });
  await waitFor(() => expect(result.current.pageCount).toBe(1));

  (fetchTranscriptPage as jest.Mock).mockImplementation(async (_threadId, cursor) =>
    cursor ? transcriptPage(pageIndexFor(cursor)) : refreshedNewest
  );
  await rerender({ live: [], running: true });
  await rerender({ live: [], running: false });

  await waitFor(() => expect(fetchTranscriptPage).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(ids(result.current.messages)).toEqual(['p0-user', 'p0-assistant', 'live-1'])
  );
});

test('retries only transient failures, at most twice', () => {
  expect(shouldRetryTranscript(0, new TranscriptRequestError(503))).toBe(true);
  expect(shouldRetryTranscript(1, new TranscriptRequestError(503))).toBe(true);
  expect(shouldRetryTranscript(2, new TranscriptRequestError(503))).toBe(false);
  expect(shouldRetryTranscript(0, new TranscriptRequestError(400))).toBe(false);
});
