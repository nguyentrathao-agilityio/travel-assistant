import { useThreadStore } from '@/stores/threadStore';
import { langgraphClient } from '@/lib/langgraphClient';

jest.mock('@/constants', () => ({
  SESSION_STORAGE_KEY: 'travel_session_id',
  AGENT_NAME: 'travelAgent',
  THREAD_PAGE_SIZE: 10,
}));

jest.mock('@/constants/messages', () => ({
  ERROR_MESSAGES: {
    LOAD_THREADS: 'Failed to load threads.',
    CREATE_THREAD: 'Failed to create thread.',
    DELETE_THREAD: 'Failed to delete thread.',
    RESET_THREAD: 'Failed to reset thread.',
  },
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}));

jest.mock('@/lib/langgraphClient', () => ({
  langgraphClient: {
    threads: {
      search: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockClearTripState = jest.fn();

jest.mock('@/stores/tripStateStore', () => ({
  useTripStateStore: {
    getState: () => ({ clearTripState: mockClearTripState }),
  },
}));

const mockLanggraphClient = langgraphClient as unknown as {
  threads: {
    search: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
};

const makeThread = (id: string, title = 'Thread', daysAgo = 0) => ({
  thread_id: id,
  metadata: { resourceId: 'travelAgent' },
  created_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  updated_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  values: { messages: [{ id: `${id}-msg`, type: 'human', content: title }] },
});

// A ThreadItem (store shape), as opposed to makeThread's raw API response shape.
const makeThreadItem = (id: string, title = 'Thread') => ({
  id,
  title,
  createdAt: new Date().toISOString(),
});

beforeEach(() => {
  useThreadStore.setState({
    activeThreadId: 'initial-thread',
    isResumed: false,
    threads: [],
    isLoading: false,
    isLoadingMore: false,
    hasMoreThreads: false,
    isCreating: false,
  });
  localStorage.clear();
  jest.clearAllMocks();
  // Default: the active thread exists on the server. Tests for the "missing" path
  // override this with mockRejectedValueOnce.
  mockLanggraphClient.threads.get.mockResolvedValue(makeThread('placeholder'));
});

describe('useThreadStore — initial state', () => {
  it('defaults isLoading to true, so the sidebar shows a skeleton on first render instead of a blank flash before fetchThreads runs', () => {
    jest.isolateModules(() => {
      const fresh: { useThreadStore: typeof useThreadStore } = require('@/stores/threadStore');

      expect(fresh.useThreadStore.getState().isLoading).toBe(true);
    });
  });
});

describe('useThreadStore — synchronous actions', () => {
  it('setActiveThreadId updates activeThreadId and isResumed defaults to false', () => {
    useThreadStore.getState().setActiveThreadId('new-thread');
    expect(useThreadStore.getState().activeThreadId).toBe('new-thread');
    expect(useThreadStore.getState().isResumed).toBe(false);
  });

  it('setActiveThreadId sets isResumed=true when passed', () => {
    useThreadStore.getState().setActiveThreadId('new-thread', true);
    expect(useThreadStore.getState().isResumed).toBe(true);
  });

  it('setThreads replaces the threads list', () => {
    const threads = [
      { id: 't1', title: 'Thread', createdAt: new Date().toISOString() },
      { id: 't2', title: 'Thread', createdAt: new Date().toISOString() },
    ];

    useThreadStore.getState().setThreads(threads);
    expect(useThreadStore.getState().threads).toHaveLength(2);
  });

  it('updateThread patches a specific thread by id', () => {
    useThreadStore.setState({
      threads: [{ id: 't1', title: 'Old Title', createdAt: new Date().toISOString() }],
    });
    useThreadStore.getState().updateThread('t1', { title: 'New Title' });
    expect(useThreadStore.getState().threads[0].title).toBe('New Title');
  });

  it('updateThread does not affect other threads', () => {
    useThreadStore.setState({
      threads: [
        { id: 't1', title: 'A', createdAt: new Date().toISOString() },
        { id: 't2', title: 'B', createdAt: new Date().toISOString() },
      ],
    });
    useThreadStore.getState().updateThread('t1', { title: 'Updated' });
    expect(useThreadStore.getState().threads[1].title).toBe('B');
  });

  it('selectThread sets activeThreadId and isResumed=true', () => {
    useThreadStore.getState().selectThread('selected-thread');
    expect(useThreadStore.getState().activeThreadId).toBe('selected-thread');
    expect(useThreadStore.getState().isResumed).toBe(true);
  });
});

describe('useThreadStore — fetchThreads', () => {
  it('sets isLoading while fetching and resets after', async () => {
    mockLanggraphClient.threads.search.mockResolvedValueOnce([]);
    mockLanggraphClient.threads.create.mockResolvedValueOnce(makeThread('mock-id'));
    const fetchPromise = useThreadStore.getState().fetchThreads();

    expect(useThreadStore.getState().isLoading).toBe(true);
    await fetchPromise;
    expect(useThreadStore.getState().isLoading).toBe(false);
  });

  it('populates threads from API response', async () => {
    const activeId = useThreadStore.getState().activeThreadId;

    mockLanggraphClient.threads.search.mockResolvedValueOnce([
      makeThread(activeId, 'Trip to Da Nang'),
    ]);
    await useThreadStore.getState().fetchThreads();
    expect(useThreadStore.getState().threads).toHaveLength(1);
    expect(useThreadStore.getState().threads[0].title).toBe('Trip to Da Nang');
  });

  it('populates a brand-new thread that has no values field yet (never run)', async () => {
    const activeId = useThreadStore.getState().activeThreadId;

    mockLanggraphClient.threads.search.mockResolvedValueOnce([
      {
        thread_id: activeId,
        metadata: { resourceId: 'travelAgent', graph_id: 'travel' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'idle',
        config: {},
      },
    ]);
    await useThreadStore.getState().fetchThreads();
    expect(useThreadStore.getState().threads).toHaveLength(1);
    expect(useThreadStore.getState().threads[0].title).toBeNull();
  });

  it('shows error toast on API failure', async () => {
    const { toast } = jest.requireMock('sonner');

    mockLanggraphClient.threads.search.mockRejectedValueOnce(new Error('Network error'));
    await useThreadStore.getState().fetchThreads();
    expect(toast.error).toHaveBeenCalledWith('Failed to load threads.');
  });

  it('fetches only the first page (offset 0), sorted by most recent', async () => {
    mockLanggraphClient.threads.search.mockResolvedValueOnce([]);
    await useThreadStore.getState().fetchThreads();
    expect(mockLanggraphClient.threads.search).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 0, sortBy: 'created_at', sortOrder: 'desc' })
    );
  });

  it('sets hasMoreThreads when a full page comes back', async () => {
    const activeId = useThreadStore.getState().activeThreadId;
    const fullPage = Array.from({ length: 10 }, (_, i) => makeThread(`t${i}`, 'Thread', i));

    fullPage.push(makeThread(activeId));
    mockLanggraphClient.threads.search.mockResolvedValueOnce(fullPage.slice(0, 10));
    await useThreadStore.getState().fetchThreads();
    expect(useThreadStore.getState().hasMoreThreads).toBe(true);
  });

  it('clears hasMoreThreads when fewer than a full page comes back', async () => {
    const activeId = useThreadStore.getState().activeThreadId;

    mockLanggraphClient.threads.search.mockResolvedValueOnce([makeThread(activeId)]);
    await useThreadStore.getState().fetchThreads();
    expect(useThreadStore.getState().hasMoreThreads).toBe(false);
  });

  it('creates a new thread for the session when the active thread truly does not exist on the server', async () => {
    mockLanggraphClient.threads.get.mockRejectedValueOnce(new Error('404'));
    mockLanggraphClient.threads.search.mockResolvedValueOnce([]);
    mockLanggraphClient.threads.create.mockResolvedValueOnce(makeThread('mock-id'));

    const activeId = useThreadStore.getState().activeThreadId;

    await useThreadStore.getState().fetchThreads();

    expect(mockLanggraphClient.threads.create).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: activeId })
    );
    expect(useThreadStore.getState().threads.map((t) => t.id)).toContain(activeId);
  });

  it('does not treat the active thread as missing just because it is off the first page', async () => {
    // The active thread genuinely exists (get() resolves) but isn't among the 10 most
    // recent threads returned by the paginated search — it must not be recreated or
    // have activeThreadId reassigned to some other thread.
    const activeId = useThreadStore.getState().activeThreadId;

    mockLanggraphClient.threads.get.mockResolvedValueOnce(makeThread(activeId));
    mockLanggraphClient.threads.search.mockResolvedValueOnce([
      makeThread('recent-1'),
      makeThread('recent-2'),
    ]);

    await useThreadStore.getState().fetchThreads();

    expect(mockLanggraphClient.threads.create).not.toHaveBeenCalled();
    expect(useThreadStore.getState().activeThreadId).toBe(activeId);
    expect(useThreadStore.getState().threads.map((t) => t.id)).toEqual(['recent-1', 'recent-2']);
  });

  it('derives a title from a human message with content-part-array shape (not just plain string)', async () => {
    const activeId = useThreadStore.getState().activeThreadId;

    mockLanggraphClient.threads.search.mockResolvedValueOnce([
      {
        thread_id: activeId,
        metadata: { resourceId: 'travelAgent' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        values: {
          messages: [
            {
              id: `${activeId}-msg`,
              type: 'human',
              content: [{ type: 'text', text: 'Get local tips' }],
            },
          ],
        },
      },
    ]);
    await useThreadStore.getState().fetchThreads();
    expect(useThreadStore.getState().threads[0].title).toBe('Get local tips');
  });
});

describe('useThreadStore — fetchMoreThreads', () => {
  it('does nothing when there are no more threads to load', async () => {
    useThreadStore.setState({ hasMoreThreads: false });
    await useThreadStore.getState().fetchMoreThreads();
    expect(mockLanggraphClient.threads.search).not.toHaveBeenCalled();
  });

  it('does nothing while already loading more', async () => {
    useThreadStore.setState({ hasMoreThreads: true, isLoadingMore: true });
    await useThreadStore.getState().fetchMoreThreads();
    expect(mockLanggraphClient.threads.search).not.toHaveBeenCalled();
  });

  it('requests the next page using the current thread count as offset', async () => {
    const existing = [makeThreadItem('t1'), makeThreadItem('t2')];

    useThreadStore.setState({ threads: existing, hasMoreThreads: true });
    mockLanggraphClient.threads.search.mockResolvedValueOnce([]);

    await useThreadStore.getState().fetchMoreThreads();

    expect(mockLanggraphClient.threads.search).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 2 })
    );
  });

  it('appends the next page to the existing threads', async () => {
    useThreadStore.setState({ threads: [makeThreadItem('t1')], hasMoreThreads: true });
    mockLanggraphClient.threads.search.mockResolvedValueOnce([makeThread('t2')]);

    await useThreadStore.getState().fetchMoreThreads();

    expect(useThreadStore.getState().threads.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('does not duplicate a thread that is already loaded', async () => {
    useThreadStore.setState({ threads: [makeThreadItem('t1')], hasMoreThreads: true });
    mockLanggraphClient.threads.search.mockResolvedValueOnce([makeThread('t1'), makeThread('t2')]);

    await useThreadStore.getState().fetchMoreThreads();

    expect(useThreadStore.getState().threads.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('clears hasMoreThreads once a partial page comes back', async () => {
    useThreadStore.setState({ threads: [makeThreadItem('t1')], hasMoreThreads: true });
    mockLanggraphClient.threads.search.mockResolvedValueOnce([makeThread('t2')]);

    await useThreadStore.getState().fetchMoreThreads();

    expect(useThreadStore.getState().hasMoreThreads).toBe(false);
  });

  it('resets isLoadingMore and shows a toast on failure', async () => {
    const { toast } = jest.requireMock('sonner');

    useThreadStore.setState({ threads: [makeThreadItem('t1')], hasMoreThreads: true });
    mockLanggraphClient.threads.search.mockRejectedValueOnce(new Error('Network error'));

    await useThreadStore.getState().fetchMoreThreads();

    expect(toast.error).toHaveBeenCalledWith('Failed to load threads.');
    expect(useThreadStore.getState().isLoadingMore).toBe(false);
  });
});

describe('useThreadStore — createThread', () => {
  it('adds a new thread to the list optimistically', async () => {
    mockLanggraphClient.threads.create.mockResolvedValueOnce(makeThread('mock-id'));
    await useThreadStore.getState().createThread();
    expect(useThreadStore.getState().threads).toHaveLength(1);
  });

  it('sets activeThreadId to the new thread', async () => {
    mockLanggraphClient.threads.create.mockResolvedValueOnce(makeThread('mock-id'));
    await useThreadStore.getState().createThread();
    const newThread = useThreadStore.getState().threads[0];

    expect(useThreadStore.getState().activeThreadId).toBe(newThread?.id);
  });

  it('does not create a second thread while isCreating', async () => {
    mockLanggraphClient.threads.create.mockResolvedValue(makeThread('mock-id'));
    useThreadStore.setState({ isCreating: true });
    await useThreadStore.getState().createThread();
    expect(mockLanggraphClient.threads.create).not.toHaveBeenCalled();
  });
});

describe('useThreadStore — deleteThread', () => {
  it('removes the thread from the list', async () => {
    const thread = { id: 't1', title: 'Thread', createdAt: new Date().toISOString() };

    useThreadStore.setState({ threads: [thread], activeThreadId: 'other' });
    mockLanggraphClient.threads.delete.mockResolvedValueOnce(undefined);
    await useThreadStore.getState().deleteThread('t1');
    expect(useThreadStore.getState().threads).toHaveLength(0);
  });

  it('switches to next thread when deleting the active one', async () => {
    useThreadStore.setState({
      threads: [
        { id: 't1', title: 'Thread', createdAt: new Date().toISOString() },
        { id: 't2', title: 'Thread', createdAt: new Date().toISOString() },
      ],
      activeThreadId: 't1',
    });
    mockLanggraphClient.threads.delete.mockResolvedValueOnce(undefined);
    await useThreadStore.getState().deleteThread('t1');
    expect(useThreadStore.getState().activeThreadId).toBe('t2');
  });

  it('restores threads on API error', async () => {
    const thread = { id: 't1', title: 'Thread', createdAt: new Date().toISOString() };

    useThreadStore.setState({ threads: [thread], activeThreadId: 'other' });
    mockLanggraphClient.threads.delete.mockRejectedValueOnce(new Error('Server error'));
    await useThreadStore.getState().deleteThread('t1');
    expect(useThreadStore.getState().threads).toHaveLength(1);
  });
});

describe('useThreadStore — resetThread', () => {
  it('deletes the old thread then creates a brand-new thread id, in order', async () => {
    mockLanggraphClient.threads.delete.mockResolvedValueOnce(undefined);
    mockLanggraphClient.threads.create.mockResolvedValueOnce(makeThread('new-id'));

    await useThreadStore.getState().resetThread('t1');

    expect(mockLanggraphClient.threads.delete).toHaveBeenCalledWith('t1');
    expect(mockLanggraphClient.threads.create).toHaveBeenCalledWith(
      expect.objectContaining({ ifExists: 'do_nothing' })
    );
    const createdId = mockLanggraphClient.threads.create.mock.calls[0][0].threadId;

    expect(createdId).not.toBe('t1');
    expect(mockLanggraphClient.threads.delete.mock.invocationCallOrder[0]).toBeLessThan(
      mockLanggraphClient.threads.create.mock.invocationCallOrder[0]
    );
  });

  it('keeps the thread in the same list position under a new id, title cleared', async () => {
    const thread = { id: 't1', title: 'Trip to Da Nang', createdAt: new Date().toISOString() };

    useThreadStore.setState({ threads: [thread], activeThreadId: 'other' });
    mockLanggraphClient.threads.delete.mockResolvedValueOnce(undefined);
    mockLanggraphClient.threads.create.mockResolvedValueOnce(makeThread('new-id'));
    await useThreadStore.getState().resetThread('t1');

    const [resultThread] = useThreadStore.getState().threads;

    expect(resultThread.id).not.toBe('t1');
    expect(resultThread.title).toBeNull();
    expect(resultThread.createdAt).toBe(thread.createdAt);
  });

  it('switches activeThreadId to the new id when resetting the currently active thread', async () => {
    useThreadStore.setState({ activeThreadId: 't1' });

    mockLanggraphClient.threads.delete.mockResolvedValueOnce(undefined);
    mockLanggraphClient.threads.create.mockResolvedValueOnce(makeThread('new-id'));
    await useThreadStore.getState().resetThread('t1');

    const newActiveId = useThreadStore.getState().activeThreadId;

    expect(newActiveId).not.toBe('t1');
    expect(useThreadStore.getState().isResumed).toBe(true);
  });

  it('leaves activeThreadId untouched when resetting an inactive thread', async () => {
    useThreadStore.setState({ activeThreadId: 'other' });

    mockLanggraphClient.threads.delete.mockResolvedValueOnce(undefined);
    mockLanggraphClient.threads.create.mockResolvedValueOnce(makeThread('new-id'));
    await useThreadStore.getState().resetThread('t1');

    expect(useThreadStore.getState().activeThreadId).toBe('other');
  });

  it('shows a toast and leaves the thread list untouched when the delete call fails', async () => {
    const { toast } = jest.requireMock('sonner');
    const thread = { id: 't1', title: 'Trip to Da Nang', createdAt: new Date().toISOString() };

    useThreadStore.setState({ threads: [thread] });
    mockLanggraphClient.threads.delete.mockRejectedValueOnce(new Error('Server error'));
    await useThreadStore.getState().resetThread('t1');

    expect(toast.error).toHaveBeenCalledWith('Failed to reset thread.');
    expect(useThreadStore.getState().threads).toEqual([thread]);
    expect(mockLanggraphClient.threads.create).not.toHaveBeenCalled();
  });

  it('shows a toast when recreation fails after the thread was already deleted', async () => {
    const { toast } = jest.requireMock('sonner');

    // Reset (not just clear) to discard any stale queued resolutions left behind by
    // earlier tests' unconsumed `mockResolvedValueOnce` calls elsewhere in this file.
    mockLanggraphClient.threads.delete.mockReset().mockResolvedValueOnce(undefined);
    mockLanggraphClient.threads.create.mockReset().mockRejectedValueOnce(new Error('Server error'));
    await useThreadStore.getState().resetThread('t1');

    expect(toast.error).toHaveBeenCalledWith('Failed to reset thread.');
  });
});
