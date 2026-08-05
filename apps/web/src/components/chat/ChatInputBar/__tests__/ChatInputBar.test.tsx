import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAgent } from '@copilotkit/react-core/v2';
import { ChatInputBar } from '../index';

const mockMessages: { role: string; toolCalls?: unknown[] }[] = [];

const makeProps = (overrides = {}) => ({
  onSend: jest.fn(),
  inProgress: false,
  ...overrides,
});

beforeEach(() => {
  mockMessages.length = 0;
  jest.mocked(useAgent).mockClear();
  jest
    .mocked(useAgent)
    .mockReturnValue({ agent: { messages: mockMessages } } as unknown as ReturnType<
      typeof useAgent
    >);
});

describe('ChatInputBar', () => {
  describe('rendering', () => {
    it('subscribes to the configured travel agent instead of the default agent', () => {
      render(<ChatInputBar {...makeProps()} />);
      expect(useAgent).toHaveBeenCalledWith(expect.objectContaining({ agentId: 'travelAgent' }));
    });

    it('renders the textarea', () => {
      render(<ChatInputBar {...makeProps()} />);
      expect(screen.getByLabelText('Chat message')).toBeInTheDocument();
    });

    it('renders the send button', () => {
      render(<ChatInputBar {...makeProps()} />);
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('renders placeholder text in the textarea', () => {
      render(<ChatInputBar {...makeProps()} />);
      expect(screen.getByPlaceholderText('Ask me anything about your trip...')).toBeInTheDocument();
    });
  });

  describe('submit state', () => {
    it('send button is disabled when inProgress is true', () => {
      render(<ChatInputBar {...makeProps({ inProgress: true })} />);
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('send button is disabled when a tool call is pending', async () => {
      mockMessages.push({ role: 'assistant', toolCalls: [{ id: 'tc1' }] });
      render(<ChatInputBar {...makeProps()} />);
      await userEvent.setup().type(screen.getByLabelText('Chat message'), 'Hi');
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('send button is enabled when not in progress and no tool call pending', async () => {
      render(<ChatInputBar {...makeProps()} />);
      await userEvent.setup().type(screen.getByLabelText('Chat message'), 'Hello');
      expect(screen.getByLabelText('Send message')).toBeEnabled();
    });
  });

  describe('submission', () => {
    it('calls onSend with trimmed text when send button is clicked', async () => {
      const onSend = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<ChatInputBar {...makeProps({ onSend })} />);
      await user.type(screen.getByLabelText('Chat message'), '  Hello  ');
      await user.click(screen.getByLabelText('Send message'));
      expect(onSend).toHaveBeenCalledWith('Hello');
    });

    it('clears the textarea after sending', async () => {
      const user = userEvent.setup();
      render(<ChatInputBar {...makeProps({ onSend: jest.fn().mockResolvedValue(undefined) })} />);
      await user.type(screen.getByLabelText('Chat message'), 'Hello');
      await user.click(screen.getByLabelText('Send message'));
      expect(screen.getByLabelText('Chat message')).toHaveValue('');
    });

    it('submits on Enter key (not Shift+Enter)', async () => {
      const onSend = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<ChatInputBar {...makeProps({ onSend })} />);
      await user.type(screen.getByLabelText('Chat message'), 'Hello{Enter}');
      expect(onSend).toHaveBeenCalledWith('Hello');
    });

    it('does not submit on Shift+Enter', async () => {
      const onSend = jest.fn();
      const user = userEvent.setup();
      render(<ChatInputBar {...makeProps({ onSend })} />);
      await user.type(screen.getByLabelText('Chat message'), 'Hello{Shift>}{Enter}{/Shift}');
      expect(onSend).not.toHaveBeenCalled();
    });
  });
});
