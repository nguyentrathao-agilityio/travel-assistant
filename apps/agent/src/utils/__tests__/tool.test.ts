import { describe, expect, it, vi } from 'vitest';

// Schemas
import { TOOL_ERROR_CODES } from '@/schemas';

// Utils
import { classifyToolError, mapToolError, ToolTimeoutError, withToolTimeout } from '@/utils/tool';

describe('classifyToolError', () => {
  it.each([
    [new ToolTimeoutError(25), 'provider failed', TOOL_ERROR_CODES.TIMEOUT, true],
    [
      new Error('401 Unauthorized'),
      '401 Unauthorized',
      TOOL_ERROR_CODES.AUTHENTICATION_FAILED,
      false,
    ],
    [
      new Error('429 rate limit exceeded'),
      '429 rate limit exceeded',
      TOOL_ERROR_CODES.RATE_LIMITED,
      true,
    ],
    [
      new Error('503 Service Unavailable'),
      '503 Service Unavailable',
      TOOL_ERROR_CODES.PROVIDER_UNAVAILABLE,
      true,
    ],
    [
      new Error('Invalid provider response shape'),
      'Invalid provider response shape',
      TOOL_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
      false,
    ],
    [new Error('validation failed'), 'validation failed', TOOL_ERROR_CODES.VALIDATION_ERROR, false],
    [
      new Error('unexpected failure'),
      'unexpected failure',
      TOOL_ERROR_CODES.UNKNOWN_PROVIDER_ERROR,
      false,
    ],
  ] as const)('classifies %s as %s', (error, message, code, retryable) => {
    expect(classifyToolError(error, message)).toEqual({ code, retryable });
  });

  it('keeps the most specific timeout classification when multiple patterns match', () => {
    expect(classifyToolError(new Error('401 request timed out'), '401 request timed out')).toEqual({
      code: TOOL_ERROR_CODES.TIMEOUT,
      retryable: true,
    });
  });
});

describe('mapToolError', () => {
  it.each([
    ['request timed out', TOOL_ERROR_CODES.TIMEOUT, true],
    ['429 rate limit exceeded', TOOL_ERROR_CODES.RATE_LIMITED, true],
    ['503 Service Unavailable', TOOL_ERROR_CODES.PROVIDER_UNAVAILABLE, true],
    ['401 Unauthorized', TOOL_ERROR_CODES.AUTHENTICATION_FAILED, false],
    ['Invalid provider response shape', TOOL_ERROR_CODES.INVALID_PROVIDER_RESPONSE, false],
    ['validation failed', TOOL_ERROR_CODES.VALIDATION_ERROR, false],
    ['unexpected failure', TOOL_ERROR_CODES.UNKNOWN_PROVIDER_ERROR, false],
  ] as const)('maps %s to %s', (message, code, retryable) => {
    expect(mapToolError(new Error(message), 'test-provider', 'fallback')).toEqual({
      error: message,
      message,
      code,
      retryable,
      provider: 'test-provider',
    });
  });

  it('always produces a JSON-serializable error envelope', () => {
    const result = mapToolError(Symbol('failure'), 'test-provider', 'fallback');

    expect(result.code).toBe(TOOL_ERROR_CODES.UNKNOWN_PROVIDER_ERROR);
    expect(() => JSON.stringify(result)).not.toThrow();
  });
});

describe('withToolTimeout', () => {
  it('rejects a provider operation that exceeds the bounded deadline', async () => {
    vi.useFakeTimers();
    const operation = new Promise<string>(() => undefined);
    const result = withToolTimeout(operation, 25);
    const assertion = expect(result).rejects.toMatchObject({ name: 'ToolTimeoutError' });

    await vi.advanceTimersByTimeAsync(25);
    await assertion;
    vi.useRealTimers();
  });
});
