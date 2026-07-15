import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { API_KEY_STORAGE_KEY } from '@/constants';

interface ApiKeyStore {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: '' }),
    }),
    {
      name: API_KEY_STORAGE_KEY,
      partialize: (state) => ({ apiKey: state.apiKey }),
    }
  )
);
