import { verifyOpenAiApiKey } from '../openaiApiKey';

jest.mock('@/constants', () => ({
  OPENAI_API_KEY_HEADER: 'x-openai-api-key',
  RUNTIME_URL: 'http://localhost:8123/chat',
}));

const fetchMock = jest.fn();
const response = (body: unknown, ok: boolean) => ({
  ok,
  json: jest.fn().mockResolvedValue(body),
});

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
});

describe('verifyOpenAiApiKey', () => {
  it('sends the candidate in a header and resolves only for a valid response', async () => {
    fetchMock.mockResolvedValueOnce(response({ valid: true }, true));

    await expect(verifyOpenAiApiKey('sk-valid')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8123/auth/openai/verify', {
      method: 'POST',
      headers: { 'x-openai-api-key': 'sk-valid' },
    });
  });

  it.each([
    ['invalid_key', 'This API key is invalid or has been revoked.'],
    ['model_forbidden', 'This API key cannot access the required OpenAI model.'],
    ['rate_limited', 'OpenAI is rate limiting verification. Please try again.'],
    ['verification_unavailable', 'Could not verify the key right now. Please try again.'],
  ])('maps %s to a safe user-facing error', async (error, message) => {
    fetchMock.mockResolvedValueOnce(response({ valid: false, error }, false));

    await expect(verifyOpenAiApiKey('sk-secret')).rejects.toThrow(message);
  });

  it('maps malformed and network responses to a retryable error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    await expect(verifyOpenAiApiKey('sk-secret')).rejects.toThrow(
      'Could not verify the key right now. Please try again.'
    );
  });
});
