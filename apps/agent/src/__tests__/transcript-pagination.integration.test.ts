import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PgTranscriptDatabase, TranscriptStore } from '@/infrastructure/persistence';
import { buildStressTranscript } from '@/scripts/stress-transcript';
import { fetchTranscriptPage } from '@/services/transcript';

import type { TranscriptMessage, TranscriptPage } from '@repo/schemas';

// Opt-in: points at a disposable database, never the development POSTGRES_URL.
const TEST_DATABASE_URL = process.env.TRANSCRIPT_TEST_POSTGRES_URL;
const MESSAGE_COUNT = 100;
const PAGE_SIZE = 20;

const toolCallIds = (message: TranscriptMessage): string[] =>
  (message.toolCalls ?? []).map((call) => (call as { id: string }).id);

describe.skipIf(!TEST_DATABASE_URL)('transcript pagination against Postgres', () => {
  const threadId = `integration-${randomUUID()}`;
  const expectedMessages = buildStressTranscript(MESSAGE_COUNT);
  let pool: Pool;
  let database: PgTranscriptDatabase;
  let store: TranscriptStore;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DATABASE_URL });
    database = new PgTranscriptDatabase(pool);
    store = new TranscriptStore(database);
    await database.setup();

    // Retried and concurrent writes of overlapping batches must still yield one ordered record per ID.
    await Promise.all([
      store.appendMissing(threadId, expectedMessages.slice(0, 60)),
      store.appendMissing(threadId, expectedMessages.slice(40, 80)),
    ]);
    await store.appendMissing(threadId, expectedMessages);
  });

  afterAll(async () => {
    await store?.deleteThread(threadId);
    await pool?.end();
  });

  it('walks every previous cursor back to the first message without gaps or duplicates', async () => {
    const pages: TranscriptPage[] = [];
    let cursor: string | null = null;

    do {
      const page = await fetchTranscriptPage(threadId, cursor, PAGE_SIZE, store);
      pages.push(page);
      cursor = page.previousCursor;
    } while (cursor);

    const initialPage = pages[0]!;
    const allIds = [...pages]
      .reverse()
      .flatMap((page) => page.messages)
      .map((message) => message.id);

    expect(initialPage.messages.length).toBeLessThan(30);
    expect(allIds).toEqual(expectedMessages.map((message) => message.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('never splits an assistant tool call from its tool results across pages', async () => {
    let cursor: string | null = null;

    do {
      const page = await fetchTranscriptPage(threadId, cursor, PAGE_SIZE, store);
      const pageIds = new Set(page.messages.map((message) => message.id));

      for (const message of page.messages) {
        for (const callId of toolCallIds(message)) {
          const result = expectedMessages.find((candidate) => candidate.toolCallId === callId);
          expect(result && pageIds.has(result.id)).toBe(true);
        }
      }

      cursor = page.previousCursor;
    } while (cursor);
  });

  it('deletes only the requested thread', async () => {
    const otherThreadId = `integration-${randomUUID()}`;
    await store.appendMissing(otherThreadId, expectedMessages.slice(0, 3));

    await store.deleteThread(otherThreadId);

    expect(await store.pageBefore(otherThreadId, null, 10)).toEqual([]);
    expect(await store.pageBefore(threadId, null, 1)).toHaveLength(1);
  });
});
