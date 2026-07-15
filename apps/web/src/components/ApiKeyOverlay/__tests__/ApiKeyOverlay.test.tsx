import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyOverlay } from '../index';

const mockSetApiKey = jest.fn();

jest.mock('@/stores', () => ({
  useApiKeyStore: (selector: (s: { setApiKey: jest.Mock }) => unknown) =>
    selector({ setApiKey: mockSetApiKey }),
}));

beforeEach(() => mockSetApiKey.mockClear());

describe('ApiKeyOverlay', () => {
  describe('rendering', () => {
    it('renders the title', () => {
      render(<ApiKeyOverlay />);
      expect(screen.getByText('OpenAI API key')).toBeInTheDocument();
    });

    it('renders the input with placeholder', () => {
      render(<ApiKeyOverlay />);
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument();
    });

    it('renders the continue button disabled initially', () => {
      render(<ApiKeyOverlay />);
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    });

    it('renders the OpenAI link', () => {
      render(<ApiKeyOverlay />);
      expect(screen.getByRole('link', { name: /get one from openai/i })).toBeInTheDocument();
    });
  });

  describe('visibility toggle', () => {
    it('input defaults to password type', () => {
      render(<ApiKeyOverlay />);
      expect(screen.getByPlaceholderText('sk-...')).toHaveAttribute('type', 'password');
    });

    it('toggles input to text type when show button is clicked', async () => {
      const user = userEvent.setup();
      render(<ApiKeyOverlay />);
      await user.click(screen.getByLabelText('Show API key'));
      expect(screen.getByPlaceholderText('sk-...')).toHaveAttribute('type', 'text');
    });

    it('toggles back to password type on second click', async () => {
      const user = userEvent.setup();
      render(<ApiKeyOverlay />);
      await user.click(screen.getByLabelText('Show API key'));
      await user.click(screen.getByLabelText('Hide API key'));
      expect(screen.getByPlaceholderText('sk-...')).toHaveAttribute('type', 'password');
    });
  });

  describe('validation', () => {
    it('shows error when submitted with a non-sk- key', async () => {
      const user = userEvent.setup();
      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'invalid-key');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      expect(screen.getByText('Key must start with "sk-"')).toBeInTheDocument();
    });

    it('clears error when the input changes', async () => {
      const user = userEvent.setup();
      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'invalid-key');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      await user.clear(screen.getByPlaceholderText('sk-...'));
      await user.type(screen.getByPlaceholderText('sk-...'), 'sk-valid');
      expect(screen.queryByText('Key must start with "sk-"')).not.toBeInTheDocument();
    });

    it('enables the continue button when input has text', async () => {
      const user = userEvent.setup();
      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'sk-test');
      expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
    });
  });

  describe('submission', () => {
    it('calls setApiKey with trimmed valid key on form submit', async () => {
      const user = userEvent.setup();
      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'sk-abc123');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      expect(mockSetApiKey).toHaveBeenCalledWith('sk-abc123');
    });

    it('calls setApiKey when Enter key is pressed with valid key', async () => {
      const user = userEvent.setup();
      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'sk-abc123{Enter}');
      expect(mockSetApiKey).toHaveBeenCalledWith('sk-abc123');
    });

    it('does not call setApiKey when Enter key is pressed with invalid key', async () => {
      const user = userEvent.setup();
      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'bad-key{Enter}');
      expect(mockSetApiKey).not.toHaveBeenCalled();
    });
  });
});
