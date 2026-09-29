// Constants
import { DEFAULT_REQUEST_TIMEOUT_MS } from '../constants';

export class FetchTimeoutError extends Error {
  constructor(message = 'The request timed out.') {
    super(message);
    this.name = 'FetchTimeoutError';
  }
}

export const fetchWithTimeout = async (
  input: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError();
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
