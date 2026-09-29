import { act, renderHook } from '@testing-library/react-native';

import { FOCUS_VOICE_ENABLED } from '../../constants';
import { useStartNewTrip } from '../useStartNewTrip';

import type { ThreadItem } from '../../services';

const mockPush = jest.fn();
const mockCreateRemoteThread = jest.fn();
const mockGenerateThreadId = jest.fn(() => 'generated-thread');

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../services', () => {
  const actual = jest.requireActual('../../services');

  return {
    ...actual,
    createRemoteThread: (...args: unknown[]) => mockCreateRemoteThread(...args),
    generateThreadId: () => mockGenerateThreadId(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('voice start reuses an empty thread and opens full voice mode', async () => {
  const markActive = jest.fn();
  const threads: ThreadItem[] = [
    { id: 'empty-thread', title: null, createdAt: '2026-09-29T00:00:00.000Z' },
  ];
  const { result } = await renderHook(() => useStartNewTrip({ markActive, tag: 'test', threads }));

  await act(async () => {
    await result.current.handleStartNewTrip({ voiceMode: true });
  });

  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/chat',
    params: { focusVoice: FOCUS_VOICE_ENABLED, threadId: 'empty-thread' },
  });
  expect(markActive).toHaveBeenCalledWith('empty-thread');
  expect(mockGenerateThreadId).not.toHaveBeenCalled();
  expect(mockCreateRemoteThread).not.toHaveBeenCalled();
});
