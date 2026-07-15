import { useThreadStore } from '@/stores/threadStore';
import { mastraClient } from '@/lib/mastraClient';

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

jest.mock('@/lib/mastraClient', () => ({
  mastraClient: {
    listMemoryThreads: jest.fn(),
    createMemoryThread: jest.fn(),
    deleteThread: jest.fn(),
  },
}));

jest.mock('@/stores/tripStateStore', () => ({
  useTripStateStore: {
    getState: () => ({ clearTripState: jest.fn() }),
  },
}));

const mockMastraClient = mastraClient as jest.Mocked<typeof mastraClient>;

const makeThread = (id: string, title = 'Thread', daysAgo = 0) => ({
  id,
  title,
  createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  updatedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  resourceId: 'travelAgent',
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
    const threads = [makeThread('t1'), makeThread('t2')];
    useThreadStore.getState().setThreads(threads);
    expect(useThreadStore.getState().threads).toHaveLength(2);
  });

  it('updateThread patches a specific thread by id', () => {
    useThreadStore.setState({ threads: [makeThread('t1', 'Old Title')] });
    useThreadStore.getState().updateThread('t1', { title: 'New Title' });
    expect(useThreadStore.getState().threads[0].title).toBe('New Title');
  });

  it('updateThread does not affect other threads', () => {
    useThreadStore.setState({ threads: [makeThread('t1', 'A'), makeThread('t2', 'B')] });
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
    mockMastraClient.listMemoryThreads.mockResolvedValueOnce({
      total: 0,
      page: 1,
      perPage: 20,
      hasMore: false,
      threads: [],
    });
    mockMastraClient.createMemoryThread.mockResolvedValueOnce({
      id: 'mock-id',
      resourceId: 'travelAgent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const fetchPromise = useThreadStore.getState().fetchThreads();
    expect(useThreadStore.getState().isLoading).toBe(true);
    await fetchPromise;
    expect(useThreadStore.getState().isLoading).toBe(false);
  });

  it('populates threads from API response', async () => {
    const activeId = useThreadStore.getState().activeThreadId;
    mockMastraClient.listMemoryThreads.mockResolvedValueOnce({
      total: 1,
      page: 1,
      perPage: 20,
      hasMore: false,
      threads: [
        {
          id: activeId,
          resourceId: 'travelAgent',
          title: 'Trip to Da Nang',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    await useThreadStore.getState().fetchThreads();
    expect(useThreadStore.getState().threads).toHaveLength(1);
    expect(useThreadStore.getState().threads[0].title).toBe('Trip to Da Nang');
  });

  it('shows error toast on API failure', async () => {
    const { toast } = jest.requireMock('sonner');
    mockMastraClient.listMemoryThreads.mockRejectedValueOnce(new Error('Network error'));
    await useThreadStore.getState().fetchThreads();
    expect(toast.error).toHaveBeenCalledWith('Failed to load threads.');
  });
});

describe('useThreadStore — createThread', () => {
  it('adds a new thread to the list optimistically', async () => {
    mockMastraClient.createMemoryThread.mockResolvedValueOnce({
      id: 'mock-id',
      resourceId: 'travelAgent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await useThreadStore.getState().createThread();
    expect(useThreadStore.getState().threads).toHaveLength(1);
  });

  it('sets activeThreadId to the new thread', async () => {
    mockMastraClient.createMemoryThread.mockResolvedValueOnce({
      id: 'mock-id',
      resourceId: 'travelAgent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await useThreadStore.getState().createThread();
    const newThread = useThreadStore.getState().threads[0];
    expect(useThreadStore.getState().activeThreadId).toBe(newThread?.id);
  });

  it('does not create a second thread while isCreating', async () => {
    mockMastraClient.createMemoryThread.mockResolvedValue({
      id: 'mock-id',
      resourceId: 'travelAgent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    useThreadStore.setState({ isCreating: true });
    await useThreadStore.getState().createThread();
    expect(mockMastraClient.createMemoryThread).not.toHaveBeenCalled();
  });
});

describe('useThreadStore — deleteThread', () => {
  it('removes the thread from the list', async () => {
    const thread = makeThread('t1');
    useThreadStore.setState({ threads: [thread], activeThreadId: 'other' });
    mockMastraClient.deleteThread.mockResolvedValueOnce({ success: true, message: '' });
    await useThreadStore.getState().deleteThread('t1');
    expect(useThreadStore.getState().threads).toHaveLength(0);
  });

  it('switches to next thread when deleting the active one', async () => {
    useThreadStore.setState({
      threads: [makeThread('t1'), makeThread('t2')],
      activeThreadId: 't1',
    });
    mockMastraClient.deleteThread.mockResolvedValueOnce({ success: true, message: '' });
    await useThreadStore.getState().deleteThread('t1');
    expect(useThreadStore.getState().activeThreadId).toBe('t2');
  });

  it('restores threads on API error', async () => {
    const thread = makeThread('t1');
    useThreadStore.setState({ threads: [thread], activeThreadId: 'other' });
    mockMastraClient.deleteThread.mockRejectedValueOnce(new Error('Server error'));
    await useThreadStore.getState().deleteThread('t1');
    expect(useThreadStore.getState().threads).toHaveLength(1);
  });
});
