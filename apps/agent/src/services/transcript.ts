import { TranscriptCursorSchema, TranscriptPageSchema } from '@repo/schemas';

import { transcriptStore } from '@/infrastructure/persistence';

import type { StoredTranscriptMessage, TranscriptStoreApi } from '@/infrastructure/persistence';
import type { TranscriptCursor, TranscriptPage } from '@repo/schemas';

const DEFAULT_PAGE_SIZE = 20;

export class InvalidTranscriptCursorError extends Error {
  constructor() {
    super('Invalid transcript cursor');
    this.name = 'InvalidTranscriptCursorError';
  }
}

export const encodeTranscriptCursor = (threadId: string, beforeSequence: number): string =>
  Buffer.from(
    JSON.stringify({ version: 1, threadId, beforeSequence } satisfies TranscriptCursor)
  ).toString('base64url');

const decodeTranscriptCursor = (threadId: string, cursor: string): TranscriptCursor => {
  try {
    const parsed = TranscriptCursorSchema.parse(
      JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    );

    if (parsed.threadId !== threadId) throw new InvalidTranscriptCursorError();
    return parsed;
  } catch (error) {
    if (error instanceof InvalidTranscriptCursorError) throw error;
    throw new InvalidTranscriptCursorError();
  }
};

const takeOlderRow = async (
  threadId: string,
  selected: StoredTranscriptMessage[],
  buffered: StoredTranscriptMessage[],
  store: TranscriptStoreApi
): Promise<StoredTranscriptMessage | undefined> => {
  const bufferedRow = buffered.shift();
  if (bufferedRow) return bufferedRow;

  const oldestSequence = selected.at(-1)?.sequence;
  if (oldestSequence === undefined) return undefined;

  return (await store.pageBefore(threadId, oldestSequence, 1))[0];
};

const includeToolCallBoundary = async (
  threadId: string,
  selected: StoredTranscriptMessage[],
  buffered: StoredTranscriptMessage[],
  store: TranscriptStoreApi
): Promise<void> => {
  while (selected.at(-1)?.message.role === 'tool') {
    const olderRow = await takeOlderRow(threadId, selected, buffered, store);
    if (!olderRow) return;
    selected.push(olderRow);
  }
};

export const fetchTranscriptPage = async (
  threadId: string,
  cursor: string | null,
  limit = DEFAULT_PAGE_SIZE,
  store: TranscriptStoreApi = transcriptStore
): Promise<TranscriptPage> => {
  const beforeSequence = cursor ? decodeTranscriptCursor(threadId, cursor).beforeSequence : null;
  const initialRows = await store.pageBefore(threadId, beforeSequence, limit + 1);
  const selectedRows = initialRows.slice(0, limit);
  const bufferedRows = initialRows.slice(limit);

  await includeToolCallBoundary(threadId, selectedRows, bufferedRows, store);

  const oldestSequence = selectedRows.at(-1)?.sequence;
  const hasPreviousPage =
    oldestSequence !== undefined &&
    (bufferedRows.length > 0 || (await store.pageBefore(threadId, oldestSequence, 1)).length > 0);
  const previousCursor = hasPreviousPage ? encodeTranscriptCursor(threadId, oldestSequence!) : null;

  return TranscriptPageSchema.parse({
    messages: selectedRows.reverse().map((row) => row.message),
    previousCursor,
    hasPreviousPage,
  });
};
