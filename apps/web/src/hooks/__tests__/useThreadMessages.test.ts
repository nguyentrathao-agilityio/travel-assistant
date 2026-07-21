import { renderHook, waitFor } from '@testing-library/react';
import { useThreadMessages } from '@/hooks/useThreadMessages';
import { langgraphClient } from '@/lib';
import type { LangGraphRawMessage } from '@/utils';

jest.mock('@/constants', () => ({
  CHAT_ROLE: { USER: 'user', ASSISTANT: 'assistant', TOOL: 'tool' },
}));

jest.mock('@/lib', () => ({
  langgraphClient: { threads: { getState: jest.fn() } },
}));

const mockGetState = langgraphClient.threads.getState as unknown as jest.MockedFunction<
  (threadId: string) => Promise<{ values: { messages: LangGraphRawMessage[] } }>
>;

const makeRawMessage = (id: string, role: string, text: string): LangGraphRawMessage => ({
  id,
  role,
  content: text,
});

beforeEach(() => jest.clearAllMocks());

describe('useThreadMessages', () => {
  it('returns empty messages and false loading when threadId is null', () => {
    const { result } = renderHook(() => useThreadMessages(null));
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('sets loading=true while fetching and false after', async () => {
    mockGetState.mockResolvedValueOnce({
      values: { messages: [makeRawMessage('1', 'user', 'hello')] },
    });
    const { result } = renderHook(() => useThreadMessages('thread-1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('returns only user and assistant messages with non-empty text', async () => {
    mockGetState.mockResolvedValueOnce({
      values: {
        messages: [
          makeRawMessage('1', 'user', 'hello'),
          makeRawMessage('2', 'assistant', 'hi there'),
          makeRawMessage('3', 'tool', 'tool-output'),
          makeRawMessage('4', 'user', '   '),
        ],
      },
    });
    const { result } = renderHook(() => useThreadMessages('thread-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].role).toBe('assistant');
  });

  it('returns empty messages on API failure', async () => {
    mockGetState.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useThreadMessages('thread-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toEqual([]);
  });

  it('resets messages when threadId changes to null', async () => {
    mockGetState.mockResolvedValueOnce({
      values: { messages: [makeRawMessage('1', 'user', 'hello')] },
    });
    const { result, rerender } = renderHook(({ id }) => useThreadMessages(id), {
      initialProps: { id: 'thread-1' as string | null },
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    rerender({ id: null });
    expect(result.current.messages).toEqual([]);
  });
});
