import { ONBOARDING_SEEN_KEY } from './keys';
import type { KeyValueStore } from './keyValueStore';

export const getOnboardingSeen = async (store: KeyValueStore): Promise<boolean> => {
  const value = await store.getItem(ONBOARDING_SEEN_KEY);
  return value === 'true';
};

export const markOnboardingSeen = async (store: KeyValueStore): Promise<void> => {
  await store.setItem(ONBOARDING_SEEN_KEY, 'true');
};
