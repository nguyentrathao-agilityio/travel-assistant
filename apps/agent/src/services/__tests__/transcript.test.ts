import { describe, expect, it, vi } from 'vitest';

import {
  InvalidTranscriptCursorError,
  encodeTranscriptCursor,
  fetchTranscriptPage,
} from '../transcript';

import type { StoredTranscriptMessage, TranscriptStoreApi } from '@/infrastructure/persistence';
import type { TranscriptMessage } from '@repo/schemas';

const stored = (
  sequence: number,
  id: string,
  role: TranscriptMessage['role'],
  extra: Partial<TranscriptMessage> = {}
): StoredTranscriptMessage => ({
  threadId: 'thread-1',
  sequence,
  message: { id, role, content: id, ...extra },
});

const storeWith = (rows: StoredTranscriptMessage[]): TranscriptStoreApi => ({
  appendMissing: vi.fn(),
  deleteThread: vi.fn(),
  pageBefore: vi.fn(async (_threadId, before, limit) =>
    rows
      .filter((row) => before === null || row.sequence < before)
      .sort((left, right) => right.sequence - left.sequence)
      .slice(0, limit)
  ),
});

describe('transcript pagination', () => {
  it('returns newest records in ascending display order', async () => {
    const store = storeWith([
      stored(1, 'm1', 'user'),
      stored(2, 'm2', 'assistant'),
      stored(3, 'm3', 'user'),
    ]);

    const page = await fetchTranscriptPage('thread-1', null, 2, store);

    expect(page.messages.map((message) => message.id)).toEqual(['m2', 'm3']);
    expect(page.hasPreviousPage).toBe(true);
  });

  it('expands a page so an assistant tool call stays with all tool results', async () => {
    const store = storeWith([
      stored(25, 'assistant-1', 'assistant', { toolCalls: [{ id: 'call-1' }] }),
      stored(26, 'tool-1', 'tool', { toolCallId: 'call-1' }),
      stored(27, 'assistant-2', 'assistant'),
    ]);

    const page = await fetchTranscriptPage(
      'thread-1',
      encodeTranscriptCursor('thread-1', 28),
      2,
      store
    );

    expect(page.messages.map((message) => message.id)).toEqual([
      'assistant-1',
      'tool-1',
      'assistant-2',
    ]);
    expect(page.hasPreviousPage).toBe(false);
  });

  it('does not split multiple tool results from their assistant call', async () => {
    const store = storeWith([
      stored(20, 'user-1', 'user'),
      stored(21, 'assistant-1', 'assistant', {
        toolCalls: [{ id: 'call-1' }, { id: 'call-2' }],
      }),
      stored(22, 'tool-1', 'tool', { toolCallId: 'call-1' }),
      stored(23, 'tool-2', 'tool', { toolCallId: 'call-2' }),
      stored(24, 'assistant-2', 'assistant'),
    ]);

    const page = await fetchTranscriptPage('thread-1', null, 2, store);

    expect(page.messages.map((message) => message.id)).toEqual([
      'assistant-1',
      'tool-1',
      'tool-2',
      'assistant-2',
    ]);
    expect(page.hasPreviousPage).toBe(true);
  });

  it('returns an oldest page without a previous cursor', async () => {
    const page = await fetchTranscriptPage(
      'thread-1',
      null,
      20,
      storeWith([stored(1, 'm1', 'user')])
    );

    expect(page).toMatchObject({ hasPreviousPage: false, previousCursor: null });
  });

  it('rejects malformed and cross-thread cursors', async () => {
    const store = storeWith([]);

    await expect(
      fetchTranscriptPage('thread-1', 'not-base64-json', 20, store)
    ).rejects.toBeInstanceOf(InvalidTranscriptCursorError);
    await expect(
      fetchTranscriptPage('thread-1', encodeTranscriptCursor('thread-2', 10), 20, store)
    ).rejects.toBeInstanceOf(InvalidTranscriptCursorError);
  });
});
