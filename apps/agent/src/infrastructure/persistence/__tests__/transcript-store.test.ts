import { describe, expect, it } from 'vitest';

import { TranscriptStore } from '../transcript-store';

import type {
  PendingTranscriptMessage,
  StoredTranscriptMessage,
  TranscriptDatabase,
  TranscriptTransaction,
} from '../transcript-store';
import type { TranscriptMessage } from '@repo/schemas';

const message = (id: string): TranscriptMessage => ({ id, role: 'user', content: id });

class FakeTranscriptDatabase implements TranscriptDatabase, TranscriptTransaction {
  rows: StoredTranscriptMessage[];
  private queue = Promise.resolve();

  constructor(rows: StoredTranscriptMessage[] = []) {
    this.rows = [...rows];
  }

  async transaction<T>(_threadId: string, task: (tx: TranscriptTransaction) => Promise<T>) {
    const result = this.queue.then(() => task(this));
    this.queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  async existingMessageIds(threadId: string, messageIds: string[]) {
    return new Set(
      this.rows
        .filter((row) => row.threadId === threadId && messageIds.includes(row.message.id))
        .map((row) => row.message.id)
    );
  }

  async latestSequence(threadId: string) {
    return Math.max(
      0,
      ...this.rows.filter((row) => row.threadId === threadId).map((row) => row.sequence)
    );
  }

  async insertMessages(threadId: string, messages: PendingTranscriptMessage[]) {
    for (const message of messages) {
      if (
        this.rows.some((row) => row.threadId === threadId && row.message.id === message.message.id)
      ) {
        continue;
      }
      this.rows.push({
        ...message,
        threadId,
      });
    }
  }

  async pageBefore(threadId: string, beforeSequence: number | null, limit: number) {
    return this.rows
      .filter(
        (row) =>
          row.threadId === threadId && (beforeSequence === null || row.sequence < beforeSequence)
      )
      .sort((left, right) => right.sequence - left.sequence)
      .slice(0, limit);
  }

  async deleteThread(threadId: string) {
    this.rows = this.rows.filter((row) => row.threadId !== threadId);
  }

  async setup() {}
}

describe('TranscriptStore', () => {
  it('serializes a thread and inserts missing IDs once in input order', async () => {
    const database = new FakeTranscriptDatabase([
      {
        threadId: 'thread-1',
        sequence: 7,
        message: message('m1'),
      },
    ]);
    const store = new TranscriptStore(database);

    await Promise.all([
      store.appendMissing('thread-1', [message('m1'), message('m2')]),
      store.appendMissing('thread-1', [message('m2'), message('m3')]),
    ]);

    expect(
      database.rows
        .filter((row) => row.message.id !== 'm1')
        .map(({ message, sequence }) => [message.id, sequence])
    ).toEqual([
      ['m2', 8],
      ['m3', 9],
    ]);
  });

  it('reads only the requested thread before the cursor', async () => {
    const database = new FakeTranscriptDatabase([
      { threadId: 'thread-1', sequence: 1, message: message('m1') },
      { threadId: 'thread-1', sequence: 2, message: message('m2') },
      { threadId: 'thread-2', sequence: 1, message: message('other') },
    ]);

    const rows = await new TranscriptStore(database).pageBefore('thread-1', 2, 20);

    expect(rows.map((row) => row.message.id)).toEqual(['m1']);
  });

  it('deletes only the requested thread', async () => {
    const database = new FakeTranscriptDatabase([
      { threadId: 'thread-1', sequence: 1, message: message('m1') },
      { threadId: 'thread-2', sequence: 1, message: message('m2') },
    ]);

    await new TranscriptStore(database).deleteThread('thread-1');

    expect(database.rows.map((row) => row.threadId)).toEqual(['thread-2']);
  });
});
