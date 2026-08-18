import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyOverlay } from '../index';

const mockSetVerifiedApiKey = jest.fn();
const mockVerifyOpenAiApiKey = jest.fn();

jest.mock('@/stores', () => ({
  useApiKeyStore: (selector: (s: { setVerifiedApiKey: jest.Mock }) => unknown) =>
    selector({ setVerifiedApiKey: mockSetVerifiedApiKey }),
}));

jest.mock('@/services/openaiApiKey', () => ({
  verifyOpenAiApiKey: (...args: unknown[]) => mockVerifyOpenAiApiKey(...args),
}));

beforeEach(() => {
  mockSetVerifiedApiKey.mockClear();
  mockVerifyOpenAiApiKey.mockReset();
  mockVerifyOpenAiApiKey.mockResolvedValue(undefined);
});

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

    it('explains that the runtime forwards but does not persist the key', () => {
      render(<ApiKeyOverlay />);

      expect(
        screen.getByText(
          'Your key is stored locally in this browser and sent securely to OpenAI through the local agent runtime. It is not persisted by the runtime.'
        )
      ).toBeInTheDocument();
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
    it('verifies and persists the trimmed key on form submit', async () => {
      const user = userEvent.setup();

      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'sk-abc123');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      expect(mockVerifyOpenAiApiKey).toHaveBeenCalledWith('sk-abc123');
      expect(mockSetVerifiedApiKey).toHaveBeenCalledWith('sk-abc123');
    });

    it('submits exactly once when Enter is pressed with a valid key', async () => {
      const user = userEvent.setup();

      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'sk-abc123{Enter}');
      expect(mockVerifyOpenAiApiKey).toHaveBeenCalledTimes(1);
      expect(mockSetVerifiedApiKey).toHaveBeenCalledWith('sk-abc123');
    });

    it('does not verify or persist when Enter is pressed with an invalid key', async () => {
      const user = userEvent.setup();

      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'bad-key{Enter}');
      expect(mockVerifyOpenAiApiKey).not.toHaveBeenCalled();
      expect(mockSetVerifiedApiKey).not.toHaveBeenCalled();
    });

    it('shows verification progress and does not persist before verification succeeds', async () => {
      const user = userEvent.setup();
      let resolveVerification!: () => void;
      mockVerifyOpenAiApiKey.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveVerification = resolve;
        })
      );

      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'sk-pending');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(screen.getByRole('button', { name: 'Verifying…' })).toBeDisabled();
      expect(screen.getByPlaceholderText('sk-...')).toBeDisabled();
      expect(mockSetVerifiedApiKey).not.toHaveBeenCalled();

      await act(async () => resolveVerification());
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    });

    it('shows a safe verification error and keeps the key unpersisted', async () => {
      const user = userEvent.setup();
      mockVerifyOpenAiApiKey.mockRejectedValueOnce(
        new Error('This API key is invalid or has been revoked.')
      );

      render(<ApiKeyOverlay />);
      await user.type(screen.getByPlaceholderText('sk-...'), 'sk-invalid');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(
        await screen.findByText('This API key is invalid or has been revoked.')
      ).toBeInTheDocument();
      expect(mockSetVerifiedApiKey).not.toHaveBeenCalled();
    });
  });
});
