import { renderHook } from '@testing-library/react';
import { useSeedAgentHistory } from '@/hooks/useSeedAgentHistory';
import type { AgUiMessage } from '@/types';

const mockSetMessages = jest.fn();
const mockMessages = jest.fn(() => [] as AgUiMessage[]);

jest.mock('@copilotkit/react-core/v2', () => ({
  useAgent: () => ({
    agent: {
      get messages() {
        return mockMessages();
      },
      setMessages: mockSetMessages,
    },
  }),
}));

const persisted: AgUiMessage[] = [
  { id: 'm1', role: 'user', content: 'Show me places to visit in Da Nang' },
  { id: 'm2', role: 'assistant', content: 'Here are some options...' },
];

beforeEach(() => {
  mockSetMessages.mockClear();
  mockMessages.mockReturnValue([]);
});

describe('useSeedAgentHistory', () => {
  it('does not seed while history is still loading', () => {
    renderHook(() => useSeedAgentHistory('thread-1', persisted, true));
    expect(mockSetMessages).not.toHaveBeenCalled();
  });

  it('does not seed when threadId is empty', () => {
    renderHook(() => useSeedAgentHistory('', persisted, false));
    expect(mockSetMessages).not.toHaveBeenCalled();
  });

  it('seeds the live agent state once history finishes loading and live messages are empty', () => {
    renderHook(() => useSeedAgentHistory('thread-1', persisted, false));
    expect(mockSetMessages).toHaveBeenCalledWith(persisted);
    expect(mockSetMessages).toHaveBeenCalledTimes(1);
  });

  it('does not seed when there is no persisted history to seed with', () => {
    renderHook(() => useSeedAgentHistory('thread-1', [], false));
    expect(mockSetMessages).not.toHaveBeenCalled();
  });

  it('does not overwrite a conversation already in progress in this session', () => {
    mockMessages.mockReturnValue([{ id: 'live-1', role: 'user', content: 'hello' }]);
    renderHook(() => useSeedAgentHistory('thread-1', persisted, false));
    expect(mockSetMessages).not.toHaveBeenCalled();
  });

  it('still seeds when the only "live" message is the synthetic coagent-state-render placeholder', () => {
    mockMessages.mockReturnValue([
      {
        id: 'coagent-state-render-travelAgent',
        role: 'assistant',
        content: '',
        name: 'coagent-state-render',
      },
    ] as unknown as AgUiMessage[]);
    renderHook(() => useSeedAgentHistory('thread-1', persisted, false));
    expect(mockSetMessages).toHaveBeenCalledWith(persisted);
  });

  it('only seeds once per thread, even across re-renders', () => {
    const { rerender } = renderHook(
      ({ threadId }) => useSeedAgentHistory(threadId, persisted, false),
      { initialProps: { threadId: 'thread-1' } }
    );
    expect(mockSetMessages).toHaveBeenCalledTimes(1);

    rerender({ threadId: 'thread-1' });
    expect(mockSetMessages).toHaveBeenCalledTimes(1);
  });

  it('seeds again after switching to a different thread', () => {
    const { rerender } = renderHook(
      ({ threadId }) => useSeedAgentHistory(threadId, persisted, false),
      { initialProps: { threadId: 'thread-1' } }
    );
    expect(mockSetMessages).toHaveBeenCalledTimes(1);

    rerender({ threadId: 'thread-2' });
    expect(mockSetMessages).toHaveBeenCalledTimes(2);
  });
});
