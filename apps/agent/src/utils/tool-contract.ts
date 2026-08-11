// Schemas
import { ToolErrorSchema, type ToolError } from '@/schemas';

// Constants
import { contentAndArtifact } from '@/constants';

export const TOOL_TIMEOUT_MS = 15_000;

export class ToolTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Provider request timed out after ${timeoutMs}ms`);
    this.name = 'ToolTimeoutError';
  }
}

export const withToolTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs = TOOL_TIMEOUT_MS
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new ToolTimeoutError(timeoutMs)), timeoutMs);
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const mapToolError = (
  error: unknown,
  provider: string,
  fallbackMessage: string
): ToolError => {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const normalized = message.toLowerCase();

  const classification =
    error instanceof ToolTimeoutError ||
    normalized.includes('timeout') ||
    normalized.includes('timed out')
      ? { code: 'TIMEOUT' as const, retryable: true }
      : /\b(401|403)\b/.test(message) || normalized.includes('unauthorized')
        ? { code: 'AUTHENTICATION_FAILED' as const, retryable: false }
        : /\b429\b/.test(message) || normalized.includes('rate limit')
          ? { code: 'RATE_LIMITED' as const, retryable: true }
          : /\b5\d\d\b/.test(message) ||
              normalized.includes('network request failed') ||
              normalized.includes('unavailable')
            ? { code: 'PROVIDER_UNAVAILABLE' as const, retryable: true }
            : normalized.includes('invalid') && normalized.includes('response')
              ? { code: 'INVALID_PROVIDER_RESPONSE' as const, retryable: false }
              : normalized.includes('validation')
                ? { code: 'VALIDATION_ERROR' as const, retryable: false }
                : { code: 'UNKNOWN_PROVIDER_ERROR' as const, retryable: false };

  return ToolErrorSchema.parse({
    error: message,
    message,
    provider,
    ...classification,
  });
};

export const executeReadTool = async <T>(
  operation: Promise<T>,
  provider: string,
  fallbackMessage: string
): Promise<[string, T | ToolError]> => {
  try {
    return contentAndArtifact(await withToolTimeout(operation));
  } catch (error) {
    return contentAndArtifact(mapToolError(error, provider, fallbackMessage));
  }
};
