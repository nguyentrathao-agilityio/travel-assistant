import { act, renderHook, waitFor } from '@testing-library/react';
import { useThreadHistory } from '@/hooks/useThreadHistory';
import { langgraphClient } from '@/lib';
import type { LangGraphRawMessage } from '@/utils';

jest.mock('@/constants', () => ({
  AGENT_NAME: 'travelAgent',
  CHAT_ROLE: { USER: 'user', ASSISTANT: 'assistant', TOOL: 'tool' },
}));

jest.mock('@/lib', () => ({
  langgraphClient: {
    threads: { get: jest.fn().mockResolvedValue({ values: { messages: [] } }) },
  },
}));

jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));

jest.mock('@/utils', () => ({
  toAgUiMessage: jest.fn(() => null),
  isCurrentThread: (dataThreadId: string | null, activeThreadId: string | null) =>
    dataThreadId === activeThreadId,
}));

const mockGetThread = langgraphClient.threads.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useThreadHistory', () => {
  it('loads every valid thread ID, including a newly created thread', async () => {
    const { result } = renderHook(() => useThreadHistory('thread-1'));
    expect(mockGetThread).toHaveBeenCalledWith('thread-1');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('does not fetch when threadId is empty string', () => {
    renderHook(() => useThreadHistory(''));
    expect(mockGetThread).not.toHaveBeenCalled();
  });

  it('fetches messages when threadId is provided', async () => {
    const { result } = renderHook(() => useThreadHistory('thread-1'));
    expect(mockGetThread).toHaveBeenCalledWith('thread-1');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('returns converted history independently from CopilotKit live state', async () => {
    const { toAgUiMessage } = jest.requireMock('@/utils');
    const converted = { id: 'message-1', role: 'user', content: 'hello' };
    jest.mocked(toAgUiMessage).mockReturnValueOnce(converted);
    mockGetThread.mockResolvedValueOnce({
      values: { messages: [{ id: 'message-1', type: 'human', content: 'hello' }] },
    });

    const { result } = renderHook(() => useThreadHistory('thread-1'));

    await waitFor(() => expect(result.current.messages).toEqual([converted]));
  });

  it('does not error when the thread has never had a run (no values field)', async () => {
    const { toast } = jest.requireMock('sonner');
    mockGetThread.mockResolvedValueOnce({
      thread_id: 'thread-1',
      // no `values` key at all — matches the real API for a never-run thread
      next: [],
      checkpoint: {},
      metadata: {},
      created_at: null,
      parent_checkpoint: null,
      tasks: [],
    });

    const { result } = renderHook(() => useThreadHistory('thread-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('ignores a stale response after switching threads', async () => {
    const { toAgUiMessage } = jest.requireMock('@/utils');
    let resolveFirstRequest:
      | ((state: { values: { messages: Array<{ id: string; content: string }> } }) => void)
      | undefined;

    mockGetThread
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstRequest = resolve;
          })
      )
      .mockResolvedValueOnce({
        values: { messages: [{ id: 'thread-2-message', content: 'second' }] },
      });
    jest.mocked(toAgUiMessage).mockImplementation((message: LangGraphRawMessage) => ({
      id: message.id,
      role: 'user',
      content: String(message.content),
    }));

    const { result, rerender } = renderHook(({ threadId }) => useThreadHistory(threadId), {
      initialProps: { threadId: 'thread-1' },
    });

    rerender({ threadId: 'thread-2' });
    await waitFor(() =>
      expect(result.current.messages).toEqual([
        { id: 'thread-2-message', role: 'user', content: 'second' },
      ])
    );

    act(() => {
      resolveFirstRequest?.({
        values: { messages: [{ id: 'thread-1-message', content: 'first' }] },
      });
    });

    expect(result.current.messages).toEqual([
      { id: 'thread-2-message', role: 'user', content: 'second' },
    ]);
  });
});
