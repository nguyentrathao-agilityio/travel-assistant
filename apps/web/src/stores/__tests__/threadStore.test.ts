import { useThreadStore } from '@/stores/threadStore';
import { langgraphClient } from '@/lib/langgraphClient';

jest.mock('@/constants', () => ({
  SESSION_STORAGE_KEY: 'travel_session_id',
  AGENT_NAME: 'travelAgent',
}));

jest.mock('@/constants/messages', () => ({
  ERROR_MESSAGES: {
    LOAD_THREADS: 'Failed to load threads.',
    CREATE_THREAD: 'Failed to create thread.',
    DELETE_THREAD: 'Failed to delete thread.',
  },
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}));

jest.mock('@/lib/langgraphClient', () => ({
  langgraphClient: {
    threads: {
      search: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/stores/tripStateStore', () => ({
  useTripStateStore: {
    getState: () => ({ clearTripState: jest.fn() }),
  },
}));

const mockLanggraphClient = langgraphClient as unknown as {
  threads: {
    search: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
};

const makeThread = (id: string, title = 'Thread', daysAgo = 0) => ({
  thread_id: id,
  metadata: { title, resourceId: 'travelAgent' },
  created_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  updated_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
});

beforeEach(() => {
  useThreadStore.setState({
    activeThreadId: 'initial-thread',
    isResumed: false,
    threads: [],
    isLoading: false,
    isCreating: false,
  });
  localStorage.clear();
  jest.clearAllMocks();
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

  it('shows error toast on API failure', async () => {
    const { toast } = jest.requireMock('sonner');
    mockLanggraphClient.threads.search.mockRejectedValueOnce(new Error('Network error'));
    await useThreadStore.getState().fetchThreads();
    expect(toast.error).toHaveBeenCalledWith('Failed to load threads.');
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
