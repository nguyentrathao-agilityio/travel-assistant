// Schemas
import { TranscriptPageSchema } from '@repo/schemas';

// Utils
import { resolveRuntimeUrl } from '../config';
import { FetchTimeoutError, fetchWithTimeout } from '../utils/fetchWithTimeout';

// Types
import type { TranscriptPage } from '@repo/schemas';

export const TRANSCRIPT_PAGE_SIZE = 20;

export class TranscriptRequestError extends Error {
  constructor(readonly status: number) {
    super(`Transcript request failed with status ${status}.`);
    this.name = 'TranscriptRequestError';
  }
}

export const isTransientTranscriptError = (error: unknown): boolean =>
  error instanceof FetchTimeoutError ||
  error instanceof TypeError ||
  (error instanceof TranscriptRequestError && error.status >= 500);

const transcriptUrl = (threadId: string): URL => {
  const runtimeUrl = resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL);
  const base = new URL(runtimeUrl.replace(/\/chat\/?$/, ''));

  return new URL(`/threads/${encodeURIComponent(threadId)}/messages`, base.origin);
};

const transcriptPageUrl = (threadId: string, cursor: string | null): string => {
  const url = transcriptUrl(threadId);

  url.searchParams.set('limit', String(TRANSCRIPT_PAGE_SIZE));
  if (cursor) url.searchParams.set('before', cursor);

  return url.toString();
};

/**
 * Fetches one page of the server-side transcript, newest page when `cursor` is null.
 * Messages come back in ascending order; `previousCursor` points at the next older page.
 */
export const fetchTranscriptPage = async (
  threadId: string,
  cursor: string | null
): Promise<TranscriptPage> => {
  const response = await fetchWithTimeout(transcriptPageUrl(threadId, cursor));

  if (!response.ok) throw new TranscriptRequestError(response.status);

  const parsed = TranscriptPageSchema.safeParse(await response.json());

  if (!parsed.success) throw new Error('Received an invalid transcript page.');

  return parsed.data;
};

export const deleteRemoteTranscript = async (threadId: string): Promise<void> => {
  const response = await fetchWithTimeout(transcriptUrl(threadId).toString(), { method: 'DELETE' });

  if (!response.ok) throw new Error('Failed to delete the remote transcript.');
};
