import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { useCopilotChatInternal } from '@copilotkit/react-core';
import { ChatMessages } from '../index';

jest.mock('../../ChatEmptyState', () => ({
  ChatEmptyState: ({ onSuggestionClick }: { onSuggestionClick: () => void }) => (
    <div data-testid="empty-state" onClick={onSuggestionClick} />
  ),
}));

type CKMessage = MessagesProps['messages'][number];

const makeMessage = (id: string, role = 'user'): CKMessage =>
  ({ id, role, content: '' }) as unknown as CKMessage;

const makeBookingMessage = (id: string, toolCallId: string): CKMessage =>
  ({
    id,
    role: 'assistant',
    toolCalls: [
      {
        id: toolCallId,
        type: 'function',
        function: {
          name: 'bookHotelTool',
          arguments: '{"hotelId":"hotel-1"}',
        },
      },
    ],
  }) as unknown as CKMessage;

const RenderMessage = ({ message }: { message: CKMessage }) => (
  <div data-testid="message">{(message as { id: string }).id}</div>
);

const defaultProps = {
  messages: [] as CKMessage[],
  inProgress: false,
  RenderMessage,
  AssistantMessage: () => null,
  UserMessage: () => null,
  ImageRenderer: () => null,
  onRegenerate: jest.fn(),
  onCopy: jest.fn(),
  onThumbsUp: jest.fn(),
  onThumbsDown: jest.fn(),
  messageFeedback: undefined,
  markdownTagRenderers: {},
  sendRef: createRef<((text: string) => Promise<unknown>) | null>(),
};

describe('ChatMessages', () => {
  beforeEach(() => {
    jest.mocked(useCopilotChatInternal).mockReturnValue({
      messages: [],
      interrupt: null,
    } as unknown as ReturnType<typeof useCopilotChatInternal>);
  });

  describe('empty state', () => {
    it('renders ChatEmptyState when there are no messages and not in progress', () => {
      render(<ChatMessages {...defaultProps} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render ChatEmptyState when inProgress is true', () => {
      render(<ChatMessages {...defaultProps} inProgress />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('does not render ChatEmptyState when messages exist', () => {
      render(<ChatMessages {...defaultProps} messages={[makeMessage('m1')]} />);
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it("renders ChatEmptyState when the only message is CopilotKit's synthetic coagent-state-render placeholder", () => {
      const placeholder = {
        id: 'coagent-state-render-travelAgent',
        role: 'assistant',
        content: '',
        name: 'coagent-state-render',
      } as unknown as CKMessage;
      render(<ChatMessages {...defaultProps} messages={[placeholder]} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('message list', () => {
    it('renders a RenderMessage for each message', () => {
      const messages = [makeMessage('m1'), makeMessage('m2')];
      render(<ChatMessages {...defaultProps} messages={messages} />);
      expect(screen.getAllByTestId('message')).toHaveLength(2);
      expect(screen.getByText('m1')).toBeInTheDocument();
      expect(screen.getByText('m2')).toBeInTheDocument();
    });

    it('renders only the latest message when stream reconciliation repeats an ID', () => {
      const messages = [makeMessage('booking-result'), makeMessage('booking-result')];

      render(<ChatMessages {...defaultProps} messages={messages} />);

      expect(screen.getAllByTestId('message')).toHaveLength(1);
    });

    it('renders one booking tool call when resume replays it with new message IDs', () => {
      const messages = [
        makeBookingMessage('assistant-1', 'tool-1'),
        makeBookingMessage('assistant-2', 'tool-2'),
      ];

      render(<ChatMessages {...defaultProps} messages={messages} />);

      expect(screen.getAllByTestId('message')).toHaveLength(1);
    });

    it('keeps identical booking calls made in separate user turns', () => {
      const messages = [
        makeBookingMessage('assistant-1', 'tool-1'),
        makeMessage('user-2'),
        makeBookingMessage('assistant-2', 'tool-2'),
      ];

      render(<ChatMessages {...defaultProps} messages={messages} />);

      expect(screen.getAllByTestId('message')).toHaveLength(3);
    });

    it('renders children inside the message list', () => {
      render(
        <ChatMessages {...defaultProps} messages={[makeMessage('m1')]}>
          <div data-testid="child-content" />
        </ChatMessages>
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('renders the active LangGraph interrupt', () => {
      jest.mocked(useCopilotChatInternal).mockReturnValue({
        messages: [],
        interrupt: <div data-testid="booking-approval">Confirm booking</div>,
      } as unknown as ReturnType<typeof useCopilotChatInternal>);

      render(<ChatMessages {...defaultProps} messages={[makeMessage('m1')]} />);

      expect(screen.getByTestId('booking-approval')).toBeInTheDocument();
    });
  });
});
