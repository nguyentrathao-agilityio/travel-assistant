import { renderHook, waitFor } from '@testing-library/react-native';

import { useApiKey } from '../useApiKey';

jest.mock('../../services/apiKeyStorage', () => ({
  clearApiKey: jest.fn(),
  getApiKey: jest.fn(),
  setApiKey: jest.fn(),
}));

import { getApiKey } from '../../services/apiKeyStorage';

test('reports missing status once no stored key resolves', async () => {
  (getApiKey as jest.Mock).mockResolvedValue(null);

  const { result } = await renderHook(() => useApiKey());

  await waitFor(() => {
    expect(result.current.status).toBe('missing');
  });
});

test('reports ready status with the stored key', async () => {
  (getApiKey as jest.Mock).mockResolvedValue('sk-stored');

  const { result } = await renderHook(() => useApiKey());

  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });
  expect(result.current.apiKey).toBe('sk-stored');
});
