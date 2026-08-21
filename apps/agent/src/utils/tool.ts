// Constants
import { WRITE_TOOL_NAMES } from '@repo/constants';
import {
  AUTHENTICATION_STATUS_PATTERN,
  RATE_LIMIT_STATUS_PATTERN,
  SERVER_ERROR_STATUS_PATTERN,
  TOOL_TIMEOUT_MS,
} from '@/constants';

// Schemas
import { TOOL_ERROR_CODES, ToolErrorSchema, type ToolError, type ToolErrorCode } from '@/schemas';

export interface ToolErrorClassification {
  code: ToolErrorCode;
  retryable: boolean;
}

export class ToolTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Provider request timed out after ${timeoutMs}ms`);
    this.name = 'ToolTimeoutError';
  }
}

/** Converts a tool artifact into LangChain's content-and-artifact response tuple. */
export const contentAndArtifact = <T>(artifact: T): [string, T] => [
  JSON.stringify(artifact),
  artifact,
];

/** Returns whether a tool performs a booking write operation. */
export const isBookingToolName = (name: string): boolean => WRITE_TOOL_NAMES.has(name);

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

export const classifyToolError = (error: unknown, message: string): ToolErrorClassification => {
  const normalizedMessage = message.toLowerCase();
  const isTimeout =
    error instanceof ToolTimeoutError ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('timed out');

  if (isTimeout) return { code: TOOL_ERROR_CODES.TIMEOUT, retryable: true };

  const isAuthenticationFailure =
    AUTHENTICATION_STATUS_PATTERN.test(message) || normalizedMessage.includes('unauthorized');

  if (isAuthenticationFailure) {
    return { code: TOOL_ERROR_CODES.AUTHENTICATION_FAILED, retryable: false };
  }

  const isRateLimited =
    RATE_LIMIT_STATUS_PATTERN.test(message) || normalizedMessage.includes('rate limit');

  if (isRateLimited) return { code: TOOL_ERROR_CODES.RATE_LIMITED, retryable: true };

  const isProviderUnavailable =
    SERVER_ERROR_STATUS_PATTERN.test(message) ||
    normalizedMessage.includes('network request failed') ||
    normalizedMessage.includes('unavailable');

  if (isProviderUnavailable) {
    return { code: TOOL_ERROR_CODES.PROVIDER_UNAVAILABLE, retryable: true };
  }

  const isInvalidProviderResponse =
    normalizedMessage.includes('invalid') && normalizedMessage.includes('response');

  if (isInvalidProviderResponse) {
    return { code: TOOL_ERROR_CODES.INVALID_PROVIDER_RESPONSE, retryable: false };
  }

  const isValidationFailure = normalizedMessage.includes('validation');

  if (isValidationFailure) {
    return { code: TOOL_ERROR_CODES.VALIDATION_ERROR, retryable: false };
  }

  return { code: TOOL_ERROR_CODES.UNKNOWN_PROVIDER_ERROR, retryable: false };
};

export const mapToolError = (
  error: unknown,
  provider: string,
  fallbackMessage: string
): ToolError => {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const classification = classifyToolError(error, message);

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
