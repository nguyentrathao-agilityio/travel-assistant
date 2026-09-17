import { FetchTimeoutError, fetchWithTimeout } from '../fetchWithTimeout';

afterEach(() => {
  jest.useRealTimers();
});

describe('FetchTimeoutError', () => {
  test('defaults to a standard timeout message', () => {
    const error = new FetchTimeoutError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('FetchTimeoutError');
    expect(error.message).toBe('The request timed out.');
  });

  test('accepts a custom message', () => {
    expect(new FetchTimeoutError('custom message').message).toBe('custom message');
  });
});

describe('fetchWithTimeout', () => {
  test('resolves with the response when fetch succeeds', async () => {
    const mockResponse = { ok: true };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout('https://example.com');

    expect(result).toBe(mockResponse);
  });

  test('passes the input and init options through to fetch, plus an abort signal', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await fetchWithTimeout('https://example.com', { method: 'POST', headers: { a: 'b' } });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'POST',
        headers: { a: 'b' },
        signal: expect.any(AbortSignal),
      })
    );
  });

  test('wraps an AbortError into a FetchTimeoutError', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    global.fetch = jest.fn().mockRejectedValue(abortError);

    await expect(fetchWithTimeout('https://example.com')).rejects.toThrow(FetchTimeoutError);
  });

  test('rethrows non-abort errors unchanged', async () => {
    const networkError = new Error('Network failure');
    global.fetch = jest.fn().mockRejectedValue(networkError);

    await expect(fetchWithTimeout('https://example.com')).rejects.toBe(networkError);
  });

  test('aborts the underlying request once the timeout elapses', () => {
    jest.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;

    global.fetch = jest.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal;

      return new Promise(() => {});
    });

    void fetchWithTimeout('https://example.com', {}, 1000);
    expect(capturedSignal?.aborted).toBe(false);

    jest.advanceTimersByTime(1000);
    expect(capturedSignal?.aborted).toBe(true);
  });

  test('does not abort before the timeout elapses using the default timeout', () => {
    jest.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;

    global.fetch = jest.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal;

      return new Promise(() => {});
    });

    void fetchWithTimeout('https://example.com');
    jest.advanceTimersByTime(14999);
    expect(capturedSignal?.aborted).toBe(false);

    jest.advanceTimersByTime(1);
    expect(capturedSignal?.aborted).toBe(true);
  });
});
