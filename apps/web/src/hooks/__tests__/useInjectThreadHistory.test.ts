import { renderHook } from '@testing-library/react';
import { useInjectThreadHistory } from '@/hooks/useInjectThreadHistory';
import { mastraClient } from '@/lib/mastraClient';

jest.mock('@copilotkit/react-core', () => ({
  useCopilotChatInternal: () => ({ setMessages: jest.fn() }),
}));

jest.mock('@/constants', () => ({
  AGENT_NAME: 'travelAgent',
  CHAT_ROLE: { USER: 'user', ASSISTANT: 'assistant', TOOL: 'tool' },
}));

jest.mock('@/lib/mastraClient', () => ({
  mastraClient: { listThreadMessages: jest.fn().mockResolvedValue({ messages: [] }) },
}));

jest.mock('@/lib', () => ({
  mastraClient: { listThreadMessages: jest.fn().mockResolvedValue({ messages: [] }) },
}));

jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));

jest.mock('@/utils', () => ({
  extractText: (c: unknown) => (typeof c === 'string' ? c : ''),
  extractToolInvocations: () => [],
  toAgUiMessages: () => [],
  deduplicateHitlResends: (msgs: unknown[]) => msgs,
}));

const mockClient = mastraClient as jest.Mocked<typeof mastraClient>;
const mockLib = jest.requireMock('@/lib').mastraClient;

beforeEach(() => jest.clearAllMocks());

describe('useInjectThreadHistory', () => {
  it('does not fetch when isResumed is false', () => {
    renderHook(() => useInjectThreadHistory('thread-1', false));
    expect(mockClient.listThreadMessages).not.toHaveBeenCalled();
  });

  it('does not fetch when threadId is empty string', () => {
    renderHook(() => useInjectThreadHistory('', true));
    expect(mockLib.listThreadMessages).not.toHaveBeenCalled();
  });

  it('fetches messages when isResumed=true and threadId is provided', () => {
    renderHook(() => useInjectThreadHistory('thread-1', true));
    expect(mockLib.listThreadMessages).toHaveBeenCalledWith(
      'thread-1',
      expect.objectContaining({ agentId: 'travelAgent' })
    );
  });
});
