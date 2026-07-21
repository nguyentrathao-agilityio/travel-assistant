import { renderHook } from '@testing-library/react';
import { useInjectThreadHistory } from '@/hooks/useInjectThreadHistory';
import { langgraphClient } from '@/lib';

jest.mock('@copilotkit/react-core', () => ({
  useCopilotChatInternal: () => ({ setMessages: jest.fn() }),
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

beforeEach(() => jest.clearAllMocks());

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
});
