import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useActiveThreadId } from '../useActiveThreadId';

jest.mock('../../storage', () => ({
  getActiveThreadId: jest.fn(),
  setActiveThreadId: jest.fn(),
}));

import { getActiveThreadId, setActiveThreadId } from '../../storage';

test('resolves with no active thread once loading finishes', async () => {
  (getActiveThreadId as jest.Mock).mockResolvedValue(null);

  const { result } = await renderHook(() => useActiveThreadId());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  expect(result.current.activeThreadId).toBeNull();
});

test('resolves with the stored active thread id', async () => {
  (getActiveThreadId as jest.Mock).mockResolvedValue('thread-1');

  const { result } = await renderHook(() => useActiveThreadId());

  await waitFor(() => {
    expect(result.current.activeThreadId).toBe('thread-1');
  });
  expect(result.current.loading).toBe(false);
});

test('markActive persists and updates the active thread id', async () => {
  (getActiveThreadId as jest.Mock).mockResolvedValue(null);
  (setActiveThreadId as jest.Mock).mockResolvedValue(undefined);

  const { result } = await renderHook(() => useActiveThreadId());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  await act(async () => {
    await result.current.markActive('thread-2');
  });

  expect(setActiveThreadId).toHaveBeenCalledWith(expect.anything(), 'thread-2');
  await waitFor(() => {
    expect(result.current.activeThreadId).toBe('thread-2');
  });
});

test('refresh re-reads storage, picking up changes made by another mounted screen', async () => {
  (getActiveThreadId as jest.Mock).mockResolvedValue(null);

  const { result } = await renderHook(() => useActiveThreadId());

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  expect(result.current.activeThreadId).toBeNull();

  (getActiveThreadId as jest.Mock).mockResolvedValue('thread-3');

  await act(async () => {
    result.current.refresh();
  });

  await waitFor(() => {
    expect(result.current.activeThreadId).toBe('thread-3');
  });
});
