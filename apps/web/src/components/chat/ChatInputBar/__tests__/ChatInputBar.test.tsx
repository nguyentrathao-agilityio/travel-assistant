import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2';
import { ChatInputBar } from '../index';

const mockMessages: { role: string; toolCalls?: unknown[] }[] = [];

const makeProps = (overrides = {}) => ({
  onSend: jest.fn(),
  onStop: jest.fn(),
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
  jest.mocked(useCopilotKit).mockReturnValue({
    copilotkit: { interruptElement: null, subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })) },
  } as unknown as ReturnType<typeof useCopilotKit>);
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
    it('shows an enabled stop button instead of the send button while a run is active', () => {
      render(<ChatInputBar {...makeProps({ inProgress: true })} />);
      expect(screen.getByLabelText('Stop generating')).toBeEnabled();
      expect(screen.queryByLabelText('Send message')).not.toBeInTheDocument();
    });

    it('keeps the textarea editable while a run is active', async () => {
      render(<ChatInputBar {...makeProps({ inProgress: true })} />);
      const textarea = screen.getByLabelText('Chat message');

      await userEvent.setup().type(textarea, 'Draft the next question');

      expect(textarea).toHaveValue('Draft the next question');
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

    it('send button is disabled while a booking approval interrupt is pending', async () => {
      jest.mocked(useCopilotKit).mockReturnValue({
        copilotkit: {
          interruptElement: {},
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
      } as unknown as ReturnType<typeof useCopilotKit>);
      render(<ChatInputBar {...makeProps()} />);
      await userEvent.setup().type(screen.getByLabelText('Chat message'), 'Hi');
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });
  });

  describe('submission', () => {
    it('stops the active run without submitting the textarea draft', async () => {
      const onSend = jest.fn();
      const onStop = jest.fn();
      const user = userEvent.setup();
      render(<ChatInputBar {...makeProps({ inProgress: true, onSend, onStop })} />);
      await user.type(screen.getByLabelText('Chat message'), 'Keep this draft');

      await user.click(screen.getByLabelText('Stop generating'));

      expect(onStop).toHaveBeenCalledTimes(1);
      expect(onSend).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Chat message')).toHaveValue('Keep this draft');
    });

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
