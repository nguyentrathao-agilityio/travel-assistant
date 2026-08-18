import { useApiKeyStore } from '@/stores/apiKeyStore';

jest.mock('@/constants', () => ({
  API_KEY_STORAGE_KEY: 'travel_openai_api_key',
  API_KEY_VERIFICATION_VERSION: 1,
}));

beforeEach(() => {
  useApiKeyStore.setState({ apiKey: '', verificationVersion: 0 });
  localStorage.clear();
});

describe('useApiKeyStore', () => {
  it('has empty apiKey as initial state', () => {
    expect(useApiKeyStore.getState().apiKey).toBe('');
  });

  it('setVerifiedApiKey stores the key with the current verification version', () => {
    useApiKeyStore.getState().setVerifiedApiKey('sk-test-key');
    expect(useApiKeyStore.getState().apiKey).toBe('sk-test-key');
    expect(useApiKeyStore.getState().verificationVersion).toBe(1);
    expect(useApiKeyStore.getState().hasVerifiedApiKey()).toBe(true);
  });

  it('does not treat a legacy key without the current version as verified', () => {
    useApiKeyStore.setState({ apiKey: 'sk-legacy', verificationVersion: 0 });

    expect(useApiKeyStore.getState().hasVerifiedApiKey()).toBe(false);
  });

  it('clearApiKey resets both key and verification state', () => {
    useApiKeyStore.getState().setVerifiedApiKey('sk-test-key');
    useApiKeyStore.getState().clearApiKey();
    expect(useApiKeyStore.getState().apiKey).toBe('');
    expect(useApiKeyStore.getState().verificationVersion).toBe(0);
    expect(useApiKeyStore.getState().hasVerifiedApiKey()).toBe(false);
  });

  it('clearApiKey is a no-op when key is already empty', () => {
    useApiKeyStore.getState().clearApiKey();
    expect(useApiKeyStore.getState().apiKey).toBe('');
  });
});
