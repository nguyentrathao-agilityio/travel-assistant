import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../index';

describe('ChatInput', () => {
  describe('rendering', () => {
    it('renders the textarea with default placeholder', () => {
      render(<ChatInput onSend={jest.fn()} />);
      expect(screen.getByLabelText('Chat message')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ask me anything about your trip…')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<ChatInput onSend={jest.fn()} placeholder="Type here…" />);
      expect(screen.getByPlaceholderText('Type here…')).toBeInTheDocument();
    });

    it('renders the send button', () => {
      render(<ChatInput onSend={jest.fn()} />);
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('shows quick prompts when input is empty', () => {
      render(<ChatInput onSend={jest.fn()} />);
      expect(screen.getByText('Plan a 7-day Vietnam trip')).toBeInTheDocument();
    });

    it('hides quick prompts when there is text in the input', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={jest.fn()} />);
      await user.type(screen.getByLabelText('Chat message'), 'Hello');
      expect(screen.queryByText('Plan a 7-day Vietnam trip')).not.toBeInTheDocument();
    });

    it('applies additional className', () => {
      const { container } = render(<ChatInput onSend={jest.fn()} className="extra" />);
      expect(container.firstChild).toHaveClass('extra');
    });
  });

  describe('send button state', () => {
    it('send button is disabled when input is empty', () => {
      render(<ChatInput onSend={jest.fn()} />);
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('send button is enabled when input has text', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={jest.fn()} />);
      await user.type(screen.getByLabelText('Chat message'), 'Hello');
      expect(screen.getByLabelText('Send message')).toBeEnabled();
    });

    it('send button is disabled while streaming', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={jest.fn()} isStreaming />);
      await user.type(screen.getByLabelText('Chat message'), 'Hello');
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('textarea is disabled while streaming', () => {
      render(<ChatInput onSend={jest.fn()} isStreaming />);
      expect(screen.getByLabelText('Chat message')).toBeDisabled();
    });
  });

  describe('submission', () => {
    it('calls onSend with trimmed text when send button is clicked', async () => {
      const onSend = jest.fn();
      const user = userEvent.setup();
      render(<ChatInput onSend={onSend} />);
      await user.type(screen.getByLabelText('Chat message'), '  Hello world  ');
      await user.click(screen.getByLabelText('Send message'));
      expect(onSend).toHaveBeenCalledWith('Hello world');
    });

    it('clears the input after sending', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={jest.fn()} />);
      const textarea = screen.getByLabelText('Chat message');
      await user.type(textarea, 'Hello');
      await user.click(screen.getByLabelText('Send message'));
      expect(textarea).toHaveValue('');
    });

    it('calls onSend when Enter is pressed', async () => {
      const onSend = jest.fn();
      const user = userEvent.setup();
      render(<ChatInput onSend={onSend} />);
      await user.type(screen.getByLabelText('Chat message'), 'Hello{Enter}');
      expect(onSend).toHaveBeenCalledWith('Hello');
    });

    it('does not call onSend when Shift+Enter is pressed', async () => {
      const onSend = jest.fn();
      const user = userEvent.setup();
      render(<ChatInput onSend={onSend} />);
      await user.type(screen.getByLabelText('Chat message'), 'Hello{Shift>}{Enter}{/Shift}');
      expect(onSend).not.toHaveBeenCalled();
    });

    it('does not call onSend for whitespace-only input', async () => {
      const onSend = jest.fn();
      const user = userEvent.setup();
      render(<ChatInput onSend={onSend} />);
      await user.type(screen.getByLabelText('Chat message'), '   {Enter}');
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('quick prompts', () => {
    it('fills the textarea when a quick prompt is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatInput onSend={jest.fn()} />);
      await user.click(screen.getByText('Plan a 7-day Vietnam trip'));
      expect(screen.getByLabelText('Chat message')).toHaveValue('Plan a 7-day Vietnam trip');
    });
  });
});
