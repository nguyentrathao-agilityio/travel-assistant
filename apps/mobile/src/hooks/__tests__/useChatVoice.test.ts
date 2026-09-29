import { renderHook, waitFor } from '@testing-library/react-native';

import { useChatVoice } from '../useChatVoice';

const mockStartListening = jest.fn();
const mockStartVoiceMode = jest.fn();

jest.mock('../useVoiceAssistant', () => ({
  useVoiceAssistant: () => ({
    errorMessage: null,
    micLevel: { value: 0 },
    partialTranscript: '',
    startListening: mockStartListening,
    stopListening: jest.fn(),
    stopSpeaking: jest.fn(),
    voiceState: 'idle',
  }),
}));

jest.mock('../useVoiceModeConversation', () => ({
  useVoiceModeConversation: () => ({
    isActive: false,
    start: mockStartVoiceMode,
    stop: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('route auto-start enters voice mode instead of composer dictation', async () => {
  await renderHook(() =>
    useChatVoice({
      autoStart: true,
      isHistoryLoading: false,
      isReady: true,
      isRunning: false,
      messages: [],
      sendMessage: jest.fn(),
    })
  );

  await waitFor(() => expect(mockStartVoiceMode).toHaveBeenCalledTimes(1));
  expect(mockStartListening).not.toHaveBeenCalled();
});
