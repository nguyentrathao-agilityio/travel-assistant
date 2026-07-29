import { randomUUID } from 'node:crypto';
import type { BaseStore } from '@langchain/langgraph-checkpoint';

import { MEMORY_NAMESPACE } from '../constants/memory';
import { StoredMemorySchema } from '../schemas/memory';

const normalize = (memory: string) => memory.trim().toLowerCase();

/**
 * Reads every fact stored in the dev long-term-memory namespace, dropping
 * any entry that no longer matches the expected shape.
 */
export const searchMemories = async (store: BaseStore): Promise<string[]> => {
  const items = await store.search(MEMORY_NAMESPACE, { limit: 100 });
  return items
    .map((item) => StoredMemorySchema.safeParse(item.value))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data.memory);
};

/**
 * Stores a durable fact about the user, skipping it if an equivalent
 * (case-insensitive) fact is already remembered.
 */
export const saveMemory = async (store: BaseStore, memory: string): Promise<void> => {
  const existing = await searchMemories(store);
  if (existing.some((entry) => normalize(entry) === normalize(memory))) return;

  await store.put(MEMORY_NAMESPACE, randomUUID(), { memory }, false);
};
