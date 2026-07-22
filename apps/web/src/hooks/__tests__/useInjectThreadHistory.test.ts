import { renderHook } from '@testing-library/react';
import { useInjectThreadHistory } from '@/hooks/useInjectThreadHistory';
import { langgraphClient } from '@/lib';

let mockIsAvailable = true;
const mockSetMessages = jest.fn();

jest.mock('@copilotkit/react-core', () => ({
  useCopilotChatInternal: () => ({ setMessages: mockSetMessages, isAvailable: mockIsAvailable }),
}));

jest.mock('@/constants', () => ({
  AGENT_NAME: 'travelAgent',
  CHAT_ROLE: { USER: 'user', ASSISTANT: 'assistant', TOOL: 'tool' },
}));

jest.mock('@/lib', () => ({
  langgraphClient: {
    threads: { getState: jest.fn().mockResolvedValue({ values: { messages: [] } }) },
  },
}));

jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));

jest.mock('@/utils', () => ({
  toAgUiMessage: () => null,
}));

const mockGetState = langgraphClient.threads.getState as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAvailable = true;
});

describe('useInjectThreadHistory', () => {
  it('does not fetch when isResumed is false', () => {
    renderHook(() => useInjectThreadHistory('thread-1', false));
    expect(mockGetState).not.toHaveBeenCalled();
  });

  it('does not fetch when threadId is empty string', () => {
    renderHook(() => useInjectThreadHistory('', true));
    expect(mockGetState).not.toHaveBeenCalled();
  });

  it('fetches messages when isResumed=true and threadId is provided', () => {
    renderHook(() => useInjectThreadHistory('thread-1', true));
    expect(mockGetState).toHaveBeenCalledWith('thread-1');
  });

  it('does not fetch while CopilotKit agent connection is not yet available', () => {
    mockIsAvailable = false;
    renderHook(() => useInjectThreadHistory('thread-1', true));
    expect(mockGetState).not.toHaveBeenCalled();
  });

  it('fetches once the agent connection becomes available', () => {
    mockIsAvailable = false;
    const { rerender } = renderHook(
      ({ threadId, isResumed }) => useInjectThreadHistory(threadId, isResumed),
      { initialProps: { threadId: 'thread-1', isResumed: true } }
    );
    expect(mockGetState).not.toHaveBeenCalled();

    mockIsAvailable = true;
    rerender({ threadId: 'thread-1', isResumed: true });
    expect(mockGetState).toHaveBeenCalledWith('thread-1');
  });

  it('does not error when the thread has never had a run (no values field)', async () => {
    const { toast } = jest.requireMock('sonner');
    mockGetState.mockResolvedValueOnce({
      thread_id: 'thread-1',
      // no `values` key at all — matches the real API for a never-run thread
      next: [],
      checkpoint: {},
      metadata: {},
      created_at: null,
      parent_checkpoint: null,
      tasks: [],
    });

    const { result } = renderHook(() => useInjectThreadHistory('thread-1', true));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
