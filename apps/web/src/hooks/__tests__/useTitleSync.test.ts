import { renderHook } from '@testing-library/react';
import { useTitleSync } from '@/hooks/useTitleSync';

const mockMessages = jest.fn(() => [] as { role: string; content: string }[]);
let mockThreads: { id: string; title: string | null }[] = [];

const mockUpdateThread = jest.fn((threadId: string, updates: { title?: string | null }) => {
  const thread = mockThreads.find((t) => t.id === threadId);
  if (!thread) return;
  Object.assign(thread, updates);
});

jest.mock('@copilotkit/react-core/v2', () => ({
  useAgent: () => ({
    agent: {
      get messages() {
        return mockMessages();
      },
    },
  }),
}));

jest.mock('@/stores', () => {
  const useThreadStore = (selector: (state: { threads: unknown[] }) => unknown) =>
    selector({ threads: mockThreads });
  useThreadStore.getState = () => ({
    activeThreadId: 'thread-1',
    updateThread: mockUpdateThread,
  });
  return { useThreadStore };
});

jest.mock('@/utils', () => ({
  extractCopilotText: (content: unknown) => (typeof content === 'string' ? content : ''),
  isUserMessage: (msg: unknown) =>
    typeof msg === 'object' && msg !== null && (msg as { role: string }).role === 'user',
}));

beforeEach(() => {
  mockUpdateThread.mockClear();
  mockMessages.mockReturnValue([]);
  mockThreads = [];
});

describe('useTitleSync', () => {
  it('does not call updateThread when there are no messages', () => {
    mockMessages.mockReturnValue([]);
    renderHook(() => useTitleSync());
    expect(mockUpdateThread).not.toHaveBeenCalled();
  });

  it('does not call updateThread when the active thread has no matching messages', () => {
    mockMessages.mockReturnValue([{ role: 'assistant', content: 'hello' }]);
    renderHook(() => useTitleSync());
    expect(mockUpdateThread).not.toHaveBeenCalled();
  });

  it('calls updateThread with truncated title when first user message is found', () => {
    mockMessages.mockReturnValue([{ role: 'user', content: 'Find me flights to Da Nang' }]);
    renderHook(() => useTitleSync());
    expect(mockUpdateThread).toHaveBeenCalledWith(
      'thread-1',
      expect.objectContaining({ title: 'Find me flights to Da Nang' })
    );
  });

  it('truncates title to 50 characters with ellipsis', () => {
    const longMessage = 'A'.repeat(60);
    mockMessages.mockReturnValue([{ role: 'user', content: longMessage }]);
    renderHook(() => useTitleSync());
    expect(mockUpdateThread).toHaveBeenCalledWith(
      'thread-1',
      expect.objectContaining({ title: `${'A'.repeat(50)}…` })
    );
  });

  it('retries once the thread list loads after the first message already arrived', () => {
    mockMessages.mockReturnValue([{ role: 'user', content: 'Find me flights to Da Nang' }]);
    const { rerender } = renderHook(() => useTitleSync());
    expect(mockThreads).toEqual([]); // first attempt dropped — thread not loaded yet

    mockThreads = [{ id: 'thread-1', title: null }];
    rerender();

    expect(mockThreads[0].title).toBe('Find me flights to Da Nang');
  });
});
