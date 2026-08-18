import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { API_KEY_STORAGE_KEY, API_KEY_VERIFICATION_VERSION } from '@/constants';

interface ApiKeyStore {
  apiKey: string;
  verificationVersion: number;
  setVerifiedApiKey: (key: string) => void;
  clearApiKey: () => void;
  hasVerifiedApiKey: () => boolean;
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set, get) => ({
      apiKey: '',
      verificationVersion: 0,
      setVerifiedApiKey: (key) =>
        set({ apiKey: key, verificationVersion: API_KEY_VERIFICATION_VERSION }),
      clearApiKey: () => set({ apiKey: '', verificationVersion: 0 }),
      hasVerifiedApiKey: () =>
        Boolean(get().apiKey) && get().verificationVersion === API_KEY_VERIFICATION_VERSION,
    }),
    {
      name: API_KEY_STORAGE_KEY,
      version: API_KEY_VERIFICATION_VERSION,
      migrate: (persistedState, version) =>
        version === API_KEY_VERIFICATION_VERSION
          ? (persistedState as ApiKeyStore)
          : { apiKey: '', verificationVersion: 0 },
      partialize: (state) => ({
        apiKey: state.apiKey,
        verificationVersion: state.verificationVersion,
      }),
    }
  )
);
