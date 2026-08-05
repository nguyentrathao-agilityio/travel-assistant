import { randomUUID } from 'node:crypto';
import type { BaseStore } from '@langchain/langgraph-checkpoint';

import { MEMORY_NAMESPACE } from '../constants/memory';
import { StoredMemorySchema } from '../schemas/memory';

const normalize = (memory: string) => memory.trim().toLowerCase();

// "Departure city: Da Nang" -> "departure city"
const keyOf = (memory: string): string | null => {
  const separatorIndex = memory.indexOf(':');
  return separatorIndex === -1 ? null : normalize(memory.slice(0, separatorIndex));
};

/** Reads valid facts from the development memory namespace. */
export const searchMemories = async (store: BaseStore): Promise<string[]> => {
  const items = await store.search(MEMORY_NAMESPACE, { limit: 100 });
  return items
    .map((item) => StoredMemorySchema.safeParse(item.value))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data.memory);
};

/** Stores a fact, skipping duplicates and replacing values with the same key prefix. */
export const saveMemory = async (store: BaseStore, memory: string): Promise<void> => {
  const items = await store.search(MEMORY_NAMESPACE, { limit: 100 });
  const existing = items
    .map((item) => ({ key: item.key, parsed: StoredMemorySchema.safeParse(item.value) }))
    .filter(
      (entry): entry is { key: string; parsed: { success: true; data: { memory: string } } } =>
        entry.parsed.success
    );

  if (existing.some(({ parsed }) => normalize(parsed.data.memory) === normalize(memory))) return;

  const newKey = keyOf(memory);
  if (newKey) {
    const superseded = existing.filter(({ parsed }) => keyOf(parsed.data.memory) === newKey);
    await Promise.all(superseded.map(({ key }) => store.delete(MEMORY_NAMESPACE, key)));
  }

  await store.put(MEMORY_NAMESPACE, randomUUID(), { memory }, false);
};
