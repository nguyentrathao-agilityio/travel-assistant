import * as SecureStore from 'expo-secure-store';

import { OPENAI_API_KEY_STORE_KEY } from '../constants';

export const getApiKey = (): Promise<string | null> =>
  SecureStore.getItemAsync(OPENAI_API_KEY_STORE_KEY);

export const setApiKey = (apiKey: string): Promise<void> =>
  SecureStore.setItemAsync(OPENAI_API_KEY_STORE_KEY, apiKey);

export const clearApiKey = (): Promise<void> =>
  SecureStore.deleteItemAsync(OPENAI_API_KEY_STORE_KEY);
