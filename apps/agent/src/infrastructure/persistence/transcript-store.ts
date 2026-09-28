import { Pool } from 'pg';

import { POSTGRES_URL } from '@/constants';

import type { PoolClient, QueryResultRow } from 'pg';
import type { TranscriptMessage } from '@repo/schemas';

export interface PendingTranscriptMessage {
  sequence: number;
  message: TranscriptMessage;
}

export interface StoredTranscriptMessage extends PendingTranscriptMessage {
  threadId: string;
}

export interface TranscriptTransaction {
  existingMessageIds(threadId: string, messageIds: string[]): Promise<Set<string>>;
  latestSequence(threadId: string): Promise<number>;
  insertMessages(threadId: string, messages: PendingTranscriptMessage[]): Promise<void>;
}

export interface TranscriptDatabase {
  transaction<T>(
    threadId: string,
    task: (transaction: TranscriptTransaction) => Promise<T>
  ): Promise<T>;
  pageBefore(
    threadId: string,
    beforeSequence: number | null,
    limit: number
  ): Promise<StoredTranscriptMessage[]>;
  deleteThread(threadId: string): Promise<void>;
  setup(): Promise<void>;
}

export interface TranscriptStoreApi {
  appendMissing(threadId: string, messages: TranscriptMessage[]): Promise<void>;
  pageBefore(
    threadId: string,
    beforeSequence: number | null,
    limit: number
  ): Promise<StoredTranscriptMessage[]>;
  deleteThread(threadId: string): Promise<void>;
}

export class TranscriptStore implements TranscriptStoreApi {
  constructor(private readonly database: TranscriptDatabase) {}

  appendMissing(threadId: string, messages: TranscriptMessage[]): Promise<void> {
    if (messages.length === 0) return Promise.resolve();

    return this.database.transaction(threadId, async (transaction) => {
      const uniqueMessages = [
        ...new Map(messages.map((message) => [message.id, message])).values(),
      ];
      const existingIds = await transaction.existingMessageIds(
        threadId,
        uniqueMessages.map((message) => message.id)
      );
      const missingMessages = uniqueMessages.filter((message) => !existingIds.has(message.id));

      if (missingMessages.length === 0) return;

      const latestSequence = await transaction.latestSequence(threadId);
      await transaction.insertMessages(
        threadId,
        missingMessages.map((message, index) => ({
          message,
          sequence: latestSequence + index + 1,
        }))
      );
    });
  }

  pageBefore(threadId: string, beforeSequence: number | null, limit: number) {
    return this.database.pageBefore(threadId, beforeSequence, limit);
  }

  deleteThread(threadId: string) {
    return this.database.deleteThread(threadId);
  }
}

interface StoredRow extends QueryResultRow {
  thread_id: string;
  sequence: string | number;
  payload: TranscriptMessage;
}

class PgTranscriptTransaction implements TranscriptTransaction {
  constructor(private readonly client: PoolClient) {}

  async existingMessageIds(threadId: string, messageIds: string[]): Promise<Set<string>> {
    const result = await this.client.query<{ message_id: string }>(
      `SELECT message_id
         FROM chat_transcript_messages
        WHERE thread_id = $1 AND message_id = ANY($2::text[])`,
      [threadId, messageIds]
    );

    return new Set(result.rows.map((row) => row.message_id));
  }

  async latestSequence(threadId: string): Promise<number> {
    const result = await this.client.query<{ latest_sequence: string | number }>(
      `SELECT COALESCE(MAX(sequence), 0) AS latest_sequence
         FROM chat_transcript_messages
        WHERE thread_id = $1`,
      [threadId]
    );

    return Number(result.rows[0]?.latest_sequence ?? 0);
  }

  async insertMessages(threadId: string, messages: PendingTranscriptMessage[]): Promise<void> {
    for (const { message, sequence } of messages) {
      await this.client.query(
        `INSERT INTO chat_transcript_messages
           (thread_id, sequence, message_id, role, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (thread_id, message_id) DO NOTHING`,
        [threadId, sequence, message.id, message.role, JSON.stringify(message)]
      );
    }
  }
}

export class PgTranscriptDatabase implements TranscriptDatabase {
  constructor(private readonly pool: Pool) {}

  async transaction<T>(
    threadId: string,
    task: (transaction: TranscriptTransaction) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [threadId]);
      const result = await task(new PgTranscriptTransaction(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async pageBefore(
    threadId: string,
    beforeSequence: number | null,
    limit: number
  ): Promise<StoredTranscriptMessage[]> {
    const result = await this.pool.query<StoredRow>(
      `SELECT thread_id, sequence, payload
         FROM chat_transcript_messages
        WHERE thread_id = $1 AND ($2::bigint IS NULL OR sequence < $2)
        ORDER BY sequence DESC
        LIMIT $3`,
      [threadId, beforeSequence, limit]
    );

    return result.rows.map((row) => ({
      threadId: row.thread_id,
      sequence: Number(row.sequence),
      message: row.payload,
    }));
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.pool.query('DELETE FROM chat_transcript_messages WHERE thread_id = $1', [threadId]);
  }

  async setup(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS chat_transcript_messages (
        thread_id text NOT NULL,
        sequence bigint NOT NULL,
        message_id text NOT NULL,
        role text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (thread_id, sequence),
        UNIQUE (thread_id, message_id)
      );
      CREATE INDEX IF NOT EXISTS chat_transcript_messages_page_idx
        ON chat_transcript_messages (thread_id, sequence DESC);
    `);
  }
}

const transcriptDatabase = new PgTranscriptDatabase(new Pool({ connectionString: POSTGRES_URL! }));

export const transcriptStore = new TranscriptStore(transcriptDatabase);
export const setupTranscriptStore = (): Promise<void> => transcriptDatabase.setup();
