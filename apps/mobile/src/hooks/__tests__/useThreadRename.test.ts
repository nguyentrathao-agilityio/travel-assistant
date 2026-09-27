import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useThreadActions } from '../useThreadActions';

import type { ThreadItem } from '../../services';

jest.mock('../../services', () => ({
  renameRemoteThread: jest.fn(),
}));

import { renameRemoteThread } from '../../services';

const thread: ThreadItem = { createdAt: '2026-09-01T00:00:00Z', id: 't1', title: 'Da Nang trip' };
const makeOptions = (renameThread = jest.fn()) => ({
  refresh: jest.fn(),
  removeThread: jest.fn(),
  renameThread,
  threads: [] as ThreadItem[],
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

test('onStartRename opens the dialog for the given thread', async () => {
  const { result } = await renderHook(() => useThreadActions(makeOptions()));

  await act(async () => {
    result.current.rename.onStartRename(thread);
  });

  expect(result.current.rename.renamingThread).toEqual(thread);
});

test('onCancelRename closes the dialog without calling the service', async () => {
  const { result } = await renderHook(() => useThreadActions(makeOptions()));

  await act(async () => {
    result.current.rename.onStartRename(thread);
    result.current.rename.onCancelRename();
  });

  expect(result.current.rename.renamingThread).toBeNull();
  expect(renameRemoteThread).not.toHaveBeenCalled();
});

test('onConfirmRename saves remotely, updates local state, and closes the dialog', async () => {
  (renameRemoteThread as jest.Mock).mockResolvedValue(undefined);
  const renameThread = jest.fn();

  const { result } = await renderHook(() => useThreadActions(makeOptions(renameThread)));

  await act(async () => {
    result.current.rename.onStartRename(thread);
  });

  await act(async () => {
    await result.current.rename.onConfirmRename('Hoi An getaway');
  });

  expect(renameRemoteThread).toHaveBeenCalledWith('t1', 'Hoi An getaway');
  expect(renameThread).toHaveBeenCalledWith('t1', 'Hoi An getaway');
  expect(result.current.rename.renamingThread).toBeNull();
});

test('onConfirmRename surfaces an alert and keeps the dialog open when the service call fails', async () => {
  (renameRemoteThread as jest.Mock).mockRejectedValue(new Error('network down'));
  const renameThread = jest.fn();

  const { result } = await renderHook(() => useThreadActions(makeOptions(renameThread)));

  await act(async () => {
    result.current.rename.onStartRename(thread);
  });

  await act(async () => {
    await result.current.rename.onConfirmRename('Hoi An getaway');
  });

  await waitFor(() => {
    expect(Alert.alert).toHaveBeenCalledWith('Couldn’t rename this trip', 'Please try again.');
  });
  expect(renameThread).not.toHaveBeenCalled();
  expect(result.current.rename.renamingThread).toEqual(thread);
});
