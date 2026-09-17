import { act, renderHook } from '@testing-library/react-native';

import { useInterruptElement } from '../useInterruptElement';

jest.mock('@copilotkit/react-native/headless', () => ({
  useCopilotKit: jest.fn(),
}));

import { useCopilotKit } from '@copilotkit/react-native/headless';

const setup = (initialInterruptElement: unknown = null) => {
  const subscription = { unsubscribe: jest.fn() };
  const copilotkit = {
    interruptElement: initialInterruptElement,
    subscribe: jest.fn().mockReturnValue(subscription),
  };

  (useCopilotKit as jest.Mock).mockReturnValue({ copilotkit });

  return { copilotkit, subscription };
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('returns the current interrupt element from copilotkit on mount', async () => {
  const interruptElement = { type: 'approval' };
  setup(interruptElement);

  const { result } = await renderHook(() => useInterruptElement());

  expect(result.current).toBe(interruptElement);
});

test('returns null when there is no active interrupt', async () => {
  setup(null);

  const { result } = await renderHook(() => useInterruptElement());

  expect(result.current).toBeNull();
});

test('updates when copilotkit reports an interrupt element change', async () => {
  const { copilotkit } = setup(null);

  const { result } = await renderHook(() => useInterruptElement());

  const { onInterruptElementChanged } = copilotkit.subscribe.mock.calls[0][0];
  const nextInterrupt = { type: 'booking-approval' };

  await act(async () => {
    onInterruptElementChanged({ interruptElement: nextInterrupt });
  });

  expect(result.current).toBe(nextInterrupt);
});

test('unsubscribes on unmount', async () => {
  const { subscription } = setup(null);

  const { unmount } = await renderHook(() => useInterruptElement());

  await unmount();

  expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
});
