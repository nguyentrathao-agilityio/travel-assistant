import { describe, expect, it, vi } from 'vitest';

import { mapToolError, withToolTimeout } from '@/utils/tool-contract';

describe('mapToolError', () => {
  it.each([
    ['request timed out', 'TIMEOUT', true],
    ['429 rate limit exceeded', 'RATE_LIMITED', true],
    ['503 Service Unavailable', 'PROVIDER_UNAVAILABLE', true],
    ['401 Unauthorized', 'AUTHENTICATION_FAILED', false],
    ['Invalid provider response shape', 'INVALID_PROVIDER_RESPONSE', false],
    ['validation failed', 'VALIDATION_ERROR', false],
    ['unexpected failure', 'UNKNOWN_PROVIDER_ERROR', false],
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
