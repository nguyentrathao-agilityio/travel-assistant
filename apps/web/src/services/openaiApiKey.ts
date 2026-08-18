import { OPENAI_API_KEY_HEADER, RUNTIME_URL } from '@/constants';

const ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  invalid_key: 'This API key is invalid or has been revoked.',
  model_forbidden: 'This API key cannot access the required OpenAI model.',
  rate_limited: 'OpenAI is rate limiting verification. Please try again.',
  verification_unavailable: 'Could not verify the key right now. Please try again.',
};

const RETRYABLE_ERROR = ERROR_MESSAGE_BY_CODE.verification_unavailable;

const verificationUrl = (): string => {
  const runtimeUrl = new URL(RUNTIME_URL, window.location.origin);

  return new URL('/auth/openai/verify', runtimeUrl.origin).toString();
};

export const verifyOpenAiApiKey = async (apiKey: string): Promise<void> => {
  let response: Response;

  try {
    response = await fetch(verificationUrl(), {
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
