import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { MessagesProps } from '@copilotkit/react-ui';
import { ChatMessages } from '../index';

jest.mock('../../ChatEmptyState', () => ({
  ChatEmptyState: ({ onSuggestionClick }: { onSuggestionClick: () => void }) => (
    <div data-testid="empty-state" onClick={onSuggestionClick} />
  ),
}));

type CKMessage = MessagesProps['messages'][number];

const makeMessage = (id: string, role = 'user'): CKMessage =>
  ({ id, role, content: '' }) as unknown as CKMessage;

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
  });

  describe('message list', () => {
    it('renders a RenderMessage for each message', () => {
      const messages = [makeMessage('m1'), makeMessage('m2')];
      render(<ChatMessages {...defaultProps} messages={messages} />);
      expect(screen.getAllByTestId('message')).toHaveLength(2);
      expect(screen.getByText('m1')).toBeInTheDocument();
      expect(screen.getByText('m2')).toBeInTheDocument();
    });

    it('renders children inside the message list', () => {
      render(
        <ChatMessages {...defaultProps} messages={[makeMessage('m1')]}>
          <div data-testid="child-content" />
        </ChatMessages>
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });
});
