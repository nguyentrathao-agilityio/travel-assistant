import { renderHook } from '@testing-library/react';
import { useTitleSync } from '@/hooks/useTitleSync';

const mockUpdateThread = jest.fn();
const mockMessages = jest.fn(() => [] as { role: string; content: string }[]);

jest.mock('@copilotkit/react-core', () => ({
  useCopilotChatHeadless_c: () => ({ messages: mockMessages() }),
}));

jest.mock('@/stores', () => ({
  useThreadStore: {
    getState: () => ({
      activeThreadId: 'thread-1',
      threads: [],
      updateThread: mockUpdateThread,
    }),
  },
}));

jest.mock('@/utils', () => ({
  extractCopilotText: (content: unknown) => (typeof content === 'string' ? content : ''),
  isUserMessage: (msg: unknown) =>
    typeof msg === 'object' && msg !== null && (msg as { role: string }).role === 'user',
}));

beforeEach(() => {
  mockUpdateThread.mockClear();
  mockMessages.mockReturnValue([]);
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
});
