import { describe, expect, it, vi } from 'vitest';
import type { BaseStore } from '@langchain/langgraph-checkpoint';

import { saveMemory, searchMemories } from '../memory';

const makeStore = (items: { key: string; value: Record<string, unknown> }[] = []) =>
  ({
    search: vi.fn().mockResolvedValue(
      items.map((item) => ({
        ...item,
        namespace: ['dev', 'memories'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    ),
    put: vi.fn().mockResolvedValue(undefined),
  }) as unknown as BaseStore;

describe('searchMemories', () => {
  it('returns the memory field from every stored item in the dev namespace', async () => {
    const store = makeStore([
      { key: 'a', value: { memory: 'Lives in Da Nang' } },
      { key: 'b', value: { memory: 'Prefers window seats' } },
    ]);

    const result = await searchMemories(store);

    expect(store.search).toHaveBeenCalledWith(['dev', 'memories'], { limit: 100 });
    expect(result).toEqual(['Lives in Da Nang', 'Prefers window seats']);
  });

  it('drops stored items that no longer match the expected shape', async () => {
    const store = makeStore([
      { key: 'a', value: { memory: 'Lives in Da Nang' } },
      { key: 'b', value: { notMemory: 'malformed' } },
    ]);

    const result = await searchMemories(store);

    expect(result).toEqual(['Lives in Da Nang']);
  });
});

describe('saveMemory', () => {
  it('stores a new memory with indexing disabled', async () => {
    const store = makeStore([]);

    await saveMemory(store, 'Lives in Da Nang');

    expect(store.put).toHaveBeenCalledTimes(1);
    const [namespace, , value, index] = (store.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(namespace).toEqual(['dev', 'memories']);
    expect(value).toEqual({ memory: 'Lives in Da Nang' });
    expect(index).toBe(false);
  });

  it('skips saving a memory that already exists (case-insensitive)', async () => {
    const store = makeStore([{ key: 'a', value: { memory: 'Lives in Da Nang' } }]);

    await saveMemory(store, 'lives in da nang');

    expect(store.put).not.toHaveBeenCalled();
  });
});
