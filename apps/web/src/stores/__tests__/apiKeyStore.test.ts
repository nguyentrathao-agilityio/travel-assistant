import { useApiKeyStore } from '@/stores/apiKeyStore';

jest.mock('@/constants', () => ({
  API_KEY_STORAGE_KEY: 'travel_openai_api_key',
}));

beforeEach(() => {
  useApiKeyStore.setState({ apiKey: '' });
  localStorage.clear();
});

describe('useApiKeyStore', () => {
  it('has empty apiKey as initial state', () => {
    expect(useApiKeyStore.getState().apiKey).toBe('');
  });

  it('setApiKey updates the apiKey', () => {
    useApiKeyStore.getState().setApiKey('sk-test-key');
    expect(useApiKeyStore.getState().apiKey).toBe('sk-test-key');
  });

  it('setApiKey replaces an existing key', () => {
    useApiKeyStore.getState().setApiKey('sk-old-key');
    useApiKeyStore.getState().setApiKey('sk-new-key');
    expect(useApiKeyStore.getState().apiKey).toBe('sk-new-key');
  });

  it('clearApiKey resets the apiKey to empty string', () => {
    useApiKeyStore.getState().setApiKey('sk-test-key');
    useApiKeyStore.getState().clearApiKey();
    expect(useApiKeyStore.getState().apiKey).toBe('');
  });

  it('clearApiKey is a no-op when key is already empty', () => {
    useApiKeyStore.getState().clearApiKey();
    expect(useApiKeyStore.getState().apiKey).toBe('');
  });
});
