import { render } from '@testing-library/react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { ConversationMessages } from '../index';

const mockUseConversationMessages = jest.fn();

jest.mock('@/hooks', () => ({
  useConversationMessages: (...args: unknown[]) => mockUseConversationMessages(...args),
}));

const mockChatMessages = jest.fn((_props: unknown) => null);
jest.mock('../../ChatMessages', () => ({
  ChatMessages: (props: unknown) => mockChatMessages(props),
}));

jest.mock('zustand/shallow', () => ({ useShallow: (fn: unknown) => fn }));

const mockThreadStoreState = { activeThreadId: 'thread-1' };
const mockRendererStoreState = {
  threadId: 'thread-1',
  isHistoryLoading: false,
  sendMessage: jest.fn(),
};

jest.mock('@/stores', () => ({
  useThreadStore: jest.fn((selector: (s: object) => unknown) => selector(mockThreadStoreState)),
  useConversationRendererStore: jest.fn((selector: (s: object) => unknown) =>
    selector(mockRendererStoreState)
  ),
}));

const rawMessages = [{ id: 'raw-1' }] as unknown as MessagesProps['messages'];
const reconciledMessages = [{ id: 'reconciled-1' }] as unknown as MessagesProps['messages'];

const baseProps: MessagesProps = {
  messages: rawMessages,
  inProgress: false,
  RenderMessage: () => null,
  AssistantMessage: () => null,
  UserMessage: () => null,
  ImageRenderer: () => null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseConversationMessages.mockReturnValue(reconciledMessages);
});

describe('ConversationMessages', () => {
  it('passes reconciled messages and the real loading status when the renderer thread matches the active thread', () => {
    mockThreadStoreState.activeThreadId = 'thread-1';
    mockRendererStoreState.threadId = 'thread-1';
    mockRendererStoreState.isHistoryLoading = false;

    render(<ConversationMessages {...baseProps} />);

    expect(mockChatMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: reconciledMessages,
        isHistoryLoading: false,
      })
    );
  });

  it('falls back to raw messages and forces isHistoryLoading when the renderer thread does not match the active thread', () => {
    mockThreadStoreState.activeThreadId = 'thread-1';
    mockRendererStoreState.threadId = 'thread-2';
    mockRendererStoreState.isHistoryLoading = false;

    render(<ConversationMessages {...baseProps} />);

    expect(mockChatMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: rawMessages,
        isHistoryLoading: true,
      })
    );
  });
});
