import { act, renderHook } from '@testing-library/react-native';

import { useVoiceModeConversation } from '../useVoiceModeConversation';

const makeVoice = () => ({ cancelListening: jest.fn(), startListening: jest.fn() });

test('start activates voice mode and begins listening', async () => {
  const voice = makeVoice();
  const { result } = await renderHook(() => useVoiceModeConversation({ voice }));

  await act(async () => result.current.start());

  expect(result.current.isActive).toBe(true);
  expect(voice.startListening).toHaveBeenCalledTimes(1);
});

test('stop deactivates voice mode and cancels listening', async () => {
  const voice = makeVoice();
  const { result } = await renderHook(() => useVoiceModeConversation({ voice }));

  await act(async () => result.current.start());
  await act(async () => result.current.stop());

  expect(result.current.isActive).toBe(false);
  expect(voice.cancelListening).toHaveBeenCalledTimes(1);
});
