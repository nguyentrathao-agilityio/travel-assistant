import { ACTIVE_THREAD_ID_KEY } from './keys';
import type { KeyValueStore } from './keyValueStore';

export const getActiveThreadId = (store: KeyValueStore): Promise<string | null> =>
  store.getItem(ACTIVE_THREAD_ID_KEY);

export const setActiveThreadId = (store: KeyValueStore, threadId: string): Promise<void> =>
  store.setItem(ACTIVE_THREAD_ID_KEY, threadId);
