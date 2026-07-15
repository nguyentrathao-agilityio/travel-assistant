import { renderHook, waitFor } from '@testing-library/react';
import { useThreadMessages } from '@/hooks/useThreadMessages';
import { mastraClient } from '@/lib/mastraClient';
import type { MastraRawMessage } from '@/types';

jest.mock('@/constants', () => ({
  AGENT_NAME: 'travelAgent',
  CHAT_ROLE: { USER: 'user', ASSISTANT: 'assistant', TOOL: 'tool' },
}));

jest.mock('@/lib/mastraClient', () => ({
  mastraClient: { listThreadMessages: jest.fn() },
}));

interface MockMastraClient {
  listThreadMessages: jest.MockedFunction<
    (threadId: string, opts: { agentId: string }) => Promise<{ messages: MastraRawMessage[] }>
  >;
}

const mockClient = mastraClient as unknown as MockMastraClient;

const makeRawMessage = (id: string, role: string, text: string): MastraRawMessage => ({
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
    mockClient.listThreadMessages.mockResolvedValueOnce({
      messages: [makeRawMessage('1', 'user', 'hello')],
    });
    const { result } = renderHook(() => useThreadMessages('thread-1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('returns only user and assistant messages with non-empty text', async () => {
    mockClient.listThreadMessages.mockResolvedValueOnce({
      messages: [
        makeRawMessage('1', 'user', 'hello'),
        makeRawMessage('2', 'assistant', 'hi there'),
        makeRawMessage('3', 'tool', 'tool-output'),
        makeRawMessage('4', 'user', '   '),
      ],
    });
    const { result } = renderHook(() => useThreadMessages('thread-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].role).toBe('assistant');
  });

  it('returns empty messages on API failure', async () => {
    mockClient.listThreadMessages.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useThreadMessages('thread-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toEqual([]);
  });

  it('resets messages when threadId changes to null', async () => {
    mockClient.listThreadMessages.mockResolvedValueOnce({
      messages: [makeRawMessage('1', 'user', 'hello')],
    });
    const { result, rerender } = renderHook(({ id }) => useThreadMessages(id), {
      initialProps: { id: 'thread-1' as string | null },
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    rerender({ id: null });
    expect(result.current.messages).toEqual([]);
  });
});
