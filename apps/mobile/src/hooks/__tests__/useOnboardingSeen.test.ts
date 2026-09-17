import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useOnboardingSeen } from '../useOnboardingSeen';

jest.mock('../../storage', () => ({
  getOnboardingSeen: jest.fn(),
  markOnboardingSeen: jest.fn(),
}));

import { getOnboardingSeen, markOnboardingSeen } from '../../storage';

test('resolves to unseen once loading finishes', async () => {
  (getOnboardingSeen as jest.Mock).mockResolvedValue(false);

  const { result } = await renderHook(() => useOnboardingSeen());

  await waitFor(() => {
    expect(result.current.status).toBe('unseen');
  });
});

test('resolves to seen when onboarding was already completed', async () => {
  (getOnboardingSeen as jest.Mock).mockResolvedValue(true);

  const { result } = await renderHook(() => useOnboardingSeen());

  await waitFor(() => {
    expect(result.current.status).toBe('seen');
  });
});

test('markSeen persists and flips status to seen', async () => {
  (getOnboardingSeen as jest.Mock).mockResolvedValue(false);
  (markOnboardingSeen as jest.Mock).mockResolvedValue(undefined);

  const { result } = await renderHook(() => useOnboardingSeen());

  await waitFor(() => {
    expect(result.current.status).toBe('unseen');
  });

  await act(async () => {
    await result.current.markSeen();
  });

  expect(markOnboardingSeen).toHaveBeenCalledWith(expect.anything());
  expect(result.current.status).toBe('seen');
});
