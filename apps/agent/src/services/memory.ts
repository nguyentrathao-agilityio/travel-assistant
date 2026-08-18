import type { BaseStore } from '@langchain/langgraph-checkpoint';
import { randomUUID } from 'node:crypto';

// Constants
import { MEMORY_NAMESPACE, MEMORY_SEARCH_LIMIT } from '@/constants';

// Schemas
import { StoredMemorySchema } from '@/schemas';

const normalize = (memory: string) => memory.trim().toLowerCase();

// "Departure city: Da Nang" -> "departure city"
const keyOf = (memory: string): string | null => {
  const separatorIndex = memory.indexOf(':');

  return separatorIndex === -1 ? null : normalize(memory.slice(0, separatorIndex));
};

/** Reads valid facts from the development memory namespace. */
export const searchMemories = async (store: BaseStore): Promise<string[]> => {
  const items = await store.search(MEMORY_NAMESPACE, { limit: MEMORY_SEARCH_LIMIT });

  return items
    .map((item) => StoredMemorySchema.safeParse(item.value))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data.memory);
};

/** Stores a fact, skipping duplicates and replacing values with the same key prefix. */
export const saveMemory = async (store: BaseStore, memory: string): Promise<void> => {
  // Load and validate existing facts before checking for semantic duplicates.
  const items = await store.search(MEMORY_NAMESPACE, { limit: MEMORY_SEARCH_LIMIT });
  const existing = items
    .map((item) => ({ key: item.key, parsed: StoredMemorySchema.safeParse(item.value) }))
    .filter(
      (entry): entry is { key: string; parsed: { success: true; data: { memory: string } } } =>
        entry.parsed.success
    );

  if (existing.some(({ parsed }) => normalize(parsed.data.memory) === normalize(memory))) return;

  // Replace prior values that share the same fact key while preserving unrelated memories.
  const newKey = keyOf(memory);

  if (newKey) {
    const superseded = existing.filter(({ parsed }) => keyOf(parsed.data.memory) === newKey);

    await Promise.all(superseded.map(({ key }) => store.delete(MEMORY_NAMESPACE, key)));
  }

  // Persist the deduplicated fact under an independent store key.
  await store.put(MEMORY_NAMESPACE, randomUUID(), { memory }, false);
};
