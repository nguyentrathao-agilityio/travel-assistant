import { render, screen } from '@testing-library/react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { useCopilotKit } from '@copilotkit/react-core/v2';
import { ChatMessages } from '../index';
import { reconcileConversationMessages } from '@/hooks/useConversationMessages';

jest.mock('../../ChatEmptyState', () => ({
  ChatEmptyState: ({ onSuggestionClick }: { onSuggestionClick: () => void }) => (
    <div data-testid="empty-state" onClick={onSuggestionClick} />
  ),
}));

type CKMessage = MessagesProps['messages'][number];

const makeMessage = (id: string, role = 'user'): CKMessage =>
  ({ id, role, content: '' }) as unknown as CKMessage;

const makeBookingMessage = (
  id: string,
  toolCallId: string,
  args = '{"hotelId":"hotel-1"}'
): CKMessage =>
  ({
    id,
    role: 'assistant',
    toolCalls: [
      {
        id: toolCallId,
        type: 'function',
        function: {
          name: 'bookHotelTool',
          arguments: args,
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
  sendMessage: jest.fn(),
};

describe('ChatMessages', () => {
  beforeEach(() => {
    jest.mocked(useCopilotKit).mockReturnValue({
      copilotkit: {
        interruptElement: null,
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      },
    } as unknown as ReturnType<typeof useCopilotKit>);
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

      render(
        <ChatMessages {...defaultProps} messages={reconcileConversationMessages([], messages)} />
      );

      expect(screen.getAllByTestId('message')).toHaveLength(1);
    });

    it('merges persisted history with live messages without duplicating IDs', () => {
      const messages = reconcileConversationMessages(
        [makeMessage('history-1'), makeMessage('shared')],
        [makeMessage('shared'), makeMessage('live-1')]
      );
      render(<ChatMessages {...defaultProps} messages={messages} />);

      expect(screen.getAllByTestId('message')).toHaveLength(3);
      expect(screen.getByText('history-1')).toBeInTheDocument();
      expect(screen.getByText('shared')).toBeInTheDocument();
      expect(screen.getByText('live-1')).toBeInTheDocument();
    });

    it('shows a typing indicator while waiting for the first assistant message', () => {
      render(<ChatMessages {...defaultProps} messages={[makeMessage('user-1')]} inProgress />);

      expect(screen.getByRole('status', { name: 'AI is thinking' })).toBeInTheDocument();
    });

    it('replaces the avatar typing indicator with the suggestions-loading pill once an assistant message arrives', () => {
      const assistantMessage = {
        ...makeMessage('assistant-1', 'assistant'),
        content: 'I can help with that.',
      } as CKMessage;

      const { container } = render(
        <ChatMessages
          {...defaultProps}
          messages={[makeMessage('user-1'), assistantMessage]}
          inProgress
        />
      );

      expect(container.querySelector('.bg-assistant-gradient')).not.toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Loading suggestions' })).toBeInTheDocument();
      expect(screen.queryByRole('status', { name: 'AI is thinking' })).not.toBeInTheDocument();
    });

    it('does not bring the avatar typing indicator back once the current turn already has a real answer — even if inProgress stays true and a trailing tool/system message re-appears after it', () => {
      const assistantAnswer = {
        ...makeMessage('assistant-1', 'assistant'),
        content: 'To enter Vietnam as a tourist, you will need a valid passport and an e-visa.',
      } as CKMessage;
      const trailingSystemMessage = {
        id: 'system-replay-1',
        role: 'system',
        content: 'dynamic system prompt replay',
      } as unknown as CKMessage;
      const trailingToolMessage = {
        id: 'tool-replay-1',
        role: 'tool',
        toolCallId: 'call-1',
        content: '{"results":[]}',
      } as unknown as CKMessage;

      const { container } = render(
        <ChatMessages
          {...defaultProps}
          messages={[
            makeMessage('user-1'),
            assistantAnswer,
            trailingSystemMessage,
            trailingToolMessage,
          ]}
          inProgress
        />
      );

      expect(container.querySelector('.bg-assistant-gradient')).not.toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Loading suggestions' })).toBeInTheDocument();
      expect(screen.queryByRole('status', { name: 'AI is thinking' })).not.toBeInTheDocument();
    });

    it('shows a skeleton placeholder instead of suggestions while a response is still streaming, even after real content has appeared', () => {
      const assistantAnswer = {
        ...makeMessage('assistant-1', 'assistant'),
        content: 'To enter Vietnam as a tourist, you will need a valid passport and an e-visa.',
      } as CKMessage;

      const { container } = render(
        <ChatMessages
          {...defaultProps}
          messages={[makeMessage('user-1'), assistantAnswer]}
          inProgress
        />
      );

      expect(screen.queryByText('Find places')).not.toBeInTheDocument();
      const indicator = screen.getByRole('status', { name: 'Loading suggestions' });
      expect(indicator).toHaveClass('pl-[52px]');
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('shows suggestions once streaming finishes', () => {
      const assistantAnswer = {
        ...makeMessage('assistant-1', 'assistant'),
        content: 'To enter Vietnam as a tourist, you will need a valid passport and an e-visa.',
      } as CKMessage;

      render(
        <ChatMessages {...defaultProps} messages={[makeMessage('user-1'), assistantAnswer]} />
      );

      expect(screen.getByText('Find places')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows the avatar typing indicator (not the suggestions pill) before assistant text begins', () => {
      const { container } = render(
        <ChatMessages {...defaultProps} messages={[makeMessage('user-1')]} inProgress />
      );

      expect(screen.getAllByRole('status', { name: 'AI is thinking' })).toHaveLength(1);
      expect(container.querySelector('.bg-assistant-gradient')).toBeInTheDocument();
    });

    it('keeps the typing indicator up while a tool-result message is the latest and the assistant has not replied yet', () => {
      const toolResultMessage = {
        id: 'tool-1',
        role: 'tool',
        toolCallId: 'call-1',
        content: '{"results":[]}',
      } as unknown as CKMessage;

      render(
        <ChatMessages
          {...defaultProps}
          messages={[
            makeMessage('user-1'),
            {
              ...makeMessage('assistant-1', 'assistant'),
              content: '',
              toolCalls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: { name: 'searchKnowledge', arguments: '{}' },
                },
              ],
            } as CKMessage,
            toolResultMessage,
          ]}
          inProgress
        />
      );

      expect(screen.getByRole('status', { name: 'AI is thinking' })).toBeInTheDocument();
    });

    it('keeps the typing indicator visible after a tool card resolves and before assistant text begins', () => {
      const resolvedToolCardMessage = {
        ...makeMessage('assistant-tool-card', 'assistant'),
        content: '',
        hasResolvedToolCard: true,
      } as unknown as CKMessage;

      render(
        <ChatMessages
          {...defaultProps}
          messages={[makeMessage('user-1'), resolvedToolCardMessage]}
          inProgress
        />
      );

      expect(screen.getByRole('status', { name: 'AI is thinking' })).toBeInTheDocument();
    });

    it('does not show the typing indicator while an interrupt is waiting for the user', () => {
      jest.mocked(useCopilotKit).mockReturnValue({
        copilotkit: {
          interruptElement: <div>Approval required</div>,
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
      } as unknown as ReturnType<typeof useCopilotKit>);

      render(<ChatMessages {...defaultProps} messages={[makeMessage('user-1')]} inProgress />);

      expect(screen.queryByRole('status', { name: 'AI is thinking' })).not.toBeInTheDocument();
      expect(screen.getByText('Approval required')).toBeInTheDocument();
    });

    it('keeps the typing indicator up while a tool call has no content or card yet (e.g. a knowledge search with no render action)', () => {
      const pendingToolCallMessage = {
        ...makeMessage('assistant-1', 'assistant'),
        content: '',
        toolCalls: [
          {
            id: 'tool-1',
            type: 'function',
            function: { name: 'searchKnowledge', arguments: '{}' },
          },
        ],
      } as CKMessage;

      render(
        <ChatMessages
          {...defaultProps}
          messages={[makeMessage('user-1'), pendingToolCallMessage]}
          inProgress
        />
      );

      expect(screen.getByRole('status', { name: 'AI is thinking' })).toBeInTheDocument();
    });

    it('renders one booking tool call when resume replays it with new message IDs', () => {
      const messages = [
        makeBookingMessage('assistant-1', 'tool-1'),
        makeBookingMessage('assistant-2', 'tool-2'),
      ];

      render(
        <ChatMessages {...defaultProps} messages={reconcileConversationMessages([], messages)} />
      );

      expect(screen.getAllByTestId('message')).toHaveLength(1);
    });

    it('keeps identical booking calls made in separate user turns', () => {
      const messages = [
        makeBookingMessage('assistant-1', 'tool-1'),
        makeMessage('user-2'),
        makeBookingMessage('assistant-2', 'tool-2'),
      ];

      render(
        <ChatMessages {...defaultProps} messages={reconcileConversationMessages([], messages)} />
      );

      expect(screen.getAllByTestId('message')).toHaveLength(3);
    });

    it('deduplicates replayed booking calls when JSON argument key order changes', () => {
      const messages = [
        makeBookingMessage('assistant-1', 'tool-1', '{"hotelId":"hotel-1","rooms":1}'),
        makeBookingMessage('assistant-2', 'tool-2', '{"rooms":1,"hotelId":"hotel-1"}'),
      ];

      render(
        <ChatMessages {...defaultProps} messages={reconcileConversationMessages([], messages)} />
      );

      expect(screen.getAllByTestId('message')).toHaveLength(1);
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
      jest.mocked(useCopilotKit).mockReturnValue({
        copilotkit: {
          interruptElement: <div data-testid="booking-approval">Confirm booking</div>,
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
      } as unknown as ReturnType<typeof useCopilotKit>);

      render(<ChatMessages {...defaultProps} messages={[makeMessage('m1')]} />);

      expect(screen.getByTestId('booking-approval')).toBeInTheDocument();
    });

    it('gives the LangGraph interrupt the same avatar as an assistant message', () => {
      jest.mocked(useCopilotKit).mockReturnValue({
        copilotkit: {
          interruptElement: <div data-testid="booking-approval">Confirm booking</div>,
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
      } as unknown as ReturnType<typeof useCopilotKit>);

      const { container } = render(
        <ChatMessages {...defaultProps} messages={[makeMessage('m1')]} />
      );

      expect(screen.getByTestId('booking-approval')).toBeInTheDocument();
      expect(container.querySelector('.bg-assistant-gradient')).toBeInTheDocument();
    });
  });
});
