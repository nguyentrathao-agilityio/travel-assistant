// Constants
import { OPENAI_API_KEY_HEADER } from '@repo/constants';

// Utils
import { resolveRuntimeUrl } from '../config';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  invalid_key: 'This API key is invalid or has been revoked.',
  model_forbidden: 'This API key cannot access the required OpenAI model.',
  rate_limited: 'OpenAI is rate limiting verification. Please try again.',
  verification_unavailable: 'Could not verify the key right now. Please try again.',
};

const RETRYABLE_ERROR = ERROR_MESSAGE_BY_CODE.verification_unavailable;

// Detects a 401/invalid-key failure so the caller can clear the stored key and re-prompt.
export const isApiKeyError = (message: string): boolean =>
  /\b401\b|incorrect api key|invalid api key|openai api key is required/i.test(message);

const verificationUrl = (): string => {
  const runtimeUrl = resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL);
  const base = new URL(runtimeUrl.replace(/\/chat\/?$/, ''));

  return new URL('/auth/openai/verify', base.origin).toString();
};

export const verifyOpenAiApiKey = async (apiKey: string): Promise<void> => {
  let response: Response;

  try {
    response = await fetchWithTimeout(verificationUrl(), {
      method: 'POST',
      headers: { [OPENAI_API_KEY_HEADER]: apiKey },
    });
  } catch {
    throw new Error(RETRYABLE_ERROR);
  }

  let result: { valid?: unknown; error?: unknown };

  try {
    result = (await response.json()) as { valid?: unknown; error?: unknown };
  } catch {
    throw new Error(RETRYABLE_ERROR);
  }

  if (response.ok && result.valid === true) return;

  const code = typeof result.error === 'string' ? result.error : '';

  throw new Error(ERROR_MESSAGE_BY_CODE[code] ?? RETRYABLE_ERROR);
};
