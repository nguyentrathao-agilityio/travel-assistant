import { act, renderHook, waitFor } from '@testing-library/react-native';

import { REALTIME_VOICE_WS_URL } from '../../constants';
import { useVoiceAssistant } from '../useVoiceAssistant';

jest.mock('react-native-reanimated', () => {
  const { useRef } = jest.requireActual('react');

  return {
    useSharedValue: (initial: unknown) => useRef({ value: initial }).current,
    withTiming: (toValue: unknown) => toValue,
  };
});

const mockSpeak = jest.fn();
const mockStop = jest.fn();

jest.mock('expo-speech', () => ({
  speak: (...args: unknown[]) => mockSpeak(...args),
  stop: (...args: unknown[]) => mockStop(...args),
}));

const mockRequestRecordingPermissionsAsync = jest.fn();
const mockAudioStreamStart = jest.fn();
const mockAudioStreamStop = jest.fn();
const mockAudioStream = { start: mockAudioStreamStart, stop: mockAudioStreamStop };
let capturedOnBuffer: ((buffer: { data: ArrayBuffer }) => void) | undefined;

jest.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: (...args: unknown[]) =>
    mockRequestRecordingPermissionsAsync(...args),
  useAudioStream: (options: { onBuffer: (buffer: { data: ArrayBuffer }) => void }) => {
    capturedOnBuffer = options.onBuffer;

    return { isStreaming: false, stream: mockAudioStream };
  },
}));

const mockFetchVoiceSessionToken = jest.fn();

jest.mock('../../services/voiceSession', () => ({
  fetchVoiceSessionToken: (...args: unknown[]) => mockFetchVoiceSessionToken(...args),
}));

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];

  constructor(
    public url: string,
    public protocols?: string[]
  ) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

// @ts-expect-error test double for the global WebSocket
global.WebSocket = MockWebSocket;

const latestSocket = () => MockWebSocket.instances[MockWebSocket.instances.length - 1];

const startAndOpenSession = async (
  onTranscript: (transcript: string) => void = jest.fn(),
  isVoiceModeActiveRef: { current: boolean } = { current: true }
) => {
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
  mockFetchVoiceSessionToken.mockResolvedValue({ token: 'tok-123', model: 'gpt-realtime' });

  const { result, rerender } = await renderHook(
    ({ isAgentRunning }: { isAgentRunning: boolean }) =>
      useVoiceAssistant({ isAgentRunning, isVoiceModeActiveRef, onTranscript }),
    { initialProps: { isAgentRunning: false } }
  );

  await act(async () => {
    result.current.startListening();
  });
  await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));

  await act(async () => {
    latestSocket().onopen?.();
  });
  await waitFor(() => expect(result.current.voiceState).toBe('listening'));

  return { onTranscript, result, rerender };
};

beforeEach(() => {
  mockSpeak.mockReset();
  mockStop.mockReset();
  mockRequestRecordingPermissionsAsync.mockReset();
  mockAudioStreamStart.mockReset().mockResolvedValue(undefined);
  mockAudioStreamStop.mockReset();
  mockFetchVoiceSessionToken.mockReset();
  MockWebSocket.instances = [];
  capturedOnBuffer = undefined;
});

test('starts idle', async () => {
  const onTranscript = jest.fn();
  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript,
    })
  );

  expect(result.current.voiceState).toBe('idle');
  expect(result.current.errorMessage).toBeNull();
  expect(result.current.isPermissionDenied).toBe(false);
});

test('denied microphone permission surfaces an error and stays idle-ish', async () => {
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: false });

  const onTranscript = jest.fn();
  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript,
    })
  );

  await act(async () => {
    result.current.startListening();
  });

  await waitFor(() => {
    expect(result.current.isPermissionDenied).toBe(true);
  });
  expect(result.current.voiceState).toBe('error');
  expect(result.current.errorMessage).toMatch(/Microphone access is off/);
});

test('grants permission, opens a realtime session, and reaches listening', async () => {
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
  mockFetchVoiceSessionToken.mockResolvedValue({ token: 'tok-123', model: 'gpt-realtime' });

  const onTranscript = jest.fn();
  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript,
    })
  );

  await act(async () => {
    result.current.startListening();
  });

  await waitFor(() => {
    expect(MockWebSocket.instances).toHaveLength(1);
  });
  expect(latestSocket().url).toBe(REALTIME_VOICE_WS_URL);
  expect(latestSocket().protocols).toEqual(['realtime', 'openai-insecure-api-key.tok-123']);

  await act(async () => {
    latestSocket().onopen?.();
  });

  await waitFor(() => {
    expect(result.current.voiceState).toBe('listening');
  });
  expect(mockAudioStreamStart).toHaveBeenCalled();
  expect(latestSocket().sent[0]).toContain('"type":"transcription"');
});

test('delivers a completed transcript and returns to idle', async () => {
  const { onTranscript, result } = await startAndOpenSession();

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'Show me hotels in Da Nang',
      }),
    });
  });

  expect(onTranscript).toHaveBeenCalledWith('Show me hotels in Da Nang');
  expect(result.current.voiceState).toBe('idle');
  expect(latestSocket().readyState).toBe(MockWebSocket.CLOSED);
});

test('accumulates transcript deltas into partialTranscript as they arrive', async () => {
  const { result } = await startAndOpenSession();

  expect(result.current.partialTranscript).toBe('');

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.delta',
        delta: 'Show me ',
      }),
    });
  });
  expect(result.current.partialTranscript).toBe('Show me ');

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.delta',
        delta: 'hotels',
      }),
    });
  });
  expect(result.current.partialTranscript).toBe('Show me hotels');
});

test('clears partialTranscript once the transcript finalizes', async () => {
  const { onTranscript, result } = await startAndOpenSession();

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.delta',
        delta: 'partial',
      }),
    });
  });
  expect(result.current.partialTranscript).toBe('partial');

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'Show me hotels in Da Nang',
      }),
    });
  });

  expect(onTranscript).toHaveBeenCalledWith('Show me hotels in Da Nang');
  expect(result.current.partialTranscript).toBe('');
});

test('clears a stale partialTranscript when a new listen session starts', async () => {
  const { result, rerender } = await startAndOpenSession();

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.delta',
        delta: 'leftover',
      }),
    });
  });
  expect(result.current.partialTranscript).toBe('leftover');

  await act(async () => {
    latestSocket().onclose?.();
  });

  await rerender({ isAgentRunning: false });

  await act(async () => {
    result.current.startListening();
  });
  await waitFor(() => expect(MockWebSocket.instances).toHaveLength(2));

  expect(result.current.partialTranscript).toBe('');
});

test('updates micLevel from the RMS of streamed audio buffers', async () => {
  const { result } = await startAndOpenSession();

  expect(result.current.micLevel.value).toBe(0);

  const loud = new Int16Array([30000, -30000, 30000, -30000]);

  await act(async () => {
    capturedOnBuffer?.({ data: loud.buffer });
  });

  expect(result.current.micLevel.value).toBeGreaterThan(0);
});

test('resets micLevel to 0 once the stream stops', async () => {
  const { result } = await startAndOpenSession();

  const loud = new Int16Array([30000, -30000, 30000, -30000]);

  await act(async () => {
    capturedOnBuffer?.({ data: loud.buffer });
  });
  expect(result.current.micLevel.value).toBeGreaterThan(0);

  await act(async () => {
    result.current.stopListening();
  });

  expect(result.current.micLevel.value).toBe(0);
});

test('a provider error message surfaces an error and closes the session', async () => {
  const { onTranscript, result } = await startAndOpenSession();

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({ type: 'error', error: { message: 'boom' } }),
    });
  });

  expect(result.current.voiceState).toBe('error');
  expect(result.current.errorMessage).toMatch(/isn.t available right now/);
  expect(onTranscript).not.toHaveBeenCalled();
});

test('a socket error surfaces the unavailable message', async () => {
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
  mockFetchVoiceSessionToken.mockResolvedValue({ token: 'tok-123', model: 'gpt-realtime' });

  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript: jest.fn(),
    })
  );

  await act(async () => {
    result.current.startListening();
  });
  await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));

  await act(async () => {
    latestSocket().onerror?.();
  });

  expect(result.current.voiceState).toBe('error');
  expect(result.current.errorMessage).toMatch(/isn.t available right now/);
});

test('an unexpected close with no transcript surfaces "didn\'t catch that"', async () => {
  const { result } = await startAndOpenSession();

  await act(async () => {
    latestSocket().onclose?.();
  });

  expect(result.current.voiceState).toBe('error');
  expect(result.current.errorMessage).toMatch(/Didn.t catch that/);
});

test('stopListening closes the session and returns to idle without an error', async () => {
  const { result } = await startAndOpenSession();

  await act(async () => {
    result.current.stopListening();
  });

  expect(result.current.voiceState).toBe('idle');
  expect(result.current.errorMessage).toBeNull();
  expect(latestSocket().readyState).toBe(MockWebSocket.CLOSED);
});

test('a token fetch failure surfaces the unavailable message', async () => {
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
  mockFetchVoiceSessionToken.mockRejectedValue(new Error('no key'));

  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript: jest.fn(),
    })
  );

  await act(async () => {
    result.current.startListening();
  });

  await waitFor(() => {
    expect(result.current.voiceState).toBe('error');
  });
  expect(result.current.errorMessage).toMatch(/isn.t available right now/);
});

test('streams audio buffers over the open socket', async () => {
  await startAndOpenSession();

  const buffer = new Uint8Array([1, 2, 3]).buffer;

  await act(async () => {
    capturedOnBuffer?.({ data: buffer });
  });

  const sentAudioMessage = latestSocket().sent.find((message) =>
    message.includes('input_audio_buffer.append')
  );

  expect(sentAudioMessage).toBeDefined();
});

test('speak plays text through expo-speech and reaches speaking state', async () => {
  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript: jest.fn(),
    })
  );

  await act(async () => {
    result.current.speak('Hello there');
  });

  expect(mockSpeak).toHaveBeenCalledWith(
    'Hello there',
    expect.objectContaining({ language: 'en-US' })
  );
  expect(result.current.voiceState).toBe('speaking');
});

test('speak ignores empty/whitespace text', async () => {
  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript: jest.fn(),
    })
  );

  await act(async () => {
    result.current.speak('   ');
  });

  expect(mockSpeak).not.toHaveBeenCalled();
  expect(result.current.voiceState).toBe('idle');
});

test('stopSpeaking stops expo-speech and returns to idle', async () => {
  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript: jest.fn(),
    })
  );

  await act(async () => {
    result.current.speak('Hello there');
  });
  expect(result.current.voiceState).toBe('speaking');

  await act(async () => {
    result.current.stopSpeaking();
  });

  expect(mockStop).toHaveBeenCalled();
  expect(result.current.voiceState).toBe('idle');
});

test('reaches thinking state once a voice-started turn hands off to the agent', async () => {
  const { result, rerender } = await startAndOpenSession();

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'What is the weather?',
      }),
    });
  });

  await rerender({ isAgentRunning: true });

  expect(result.current.voiceState).toBe('thinking');

  await rerender({ isAgentRunning: false });

  expect(result.current.voiceState).toBe('idle');
});

test('does not reach thinking for a dictated transcript sent outside Voice Mode', async () => {
  const { result, rerender } = await startAndOpenSession(jest.fn(), { current: false });

  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'What is the weather?',
      }),
    });
  });

  await rerender({ isAgentRunning: true });

  expect(result.current.voiceState).toBe('idle');
});
