import { act, renderHook, waitFor } from '@testing-library/react-native';
import { StrictMode } from 'react';

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

type SpeechOptions = {
  onDone?: () => void;
  onError?: () => void;
  onStopped?: () => void;
};

const speechOptions = (call: number): SpeechOptions => mockSpeak.mock.calls[call][1];

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const renderVoiceAssistant = () =>
  renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: false,
      isVoiceModeActiveRef: { current: true },
      onTranscript: jest.fn(),
    })
  );

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

test('can start listening after the Strict Mode effect replay', async () => {
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
  mockFetchVoiceSessionToken.mockResolvedValue({ token: 'tok-123', model: 'gpt-realtime' });
  const { result } = await renderHook(
    () =>
      useVoiceAssistant({
        isAgentRunning: false,
        isVoiceModeActiveRef: { current: true },
        onTranscript: jest.fn(),
      }),
    { wrapper: StrictMode }
  );

  await act(async () => result.current.startListening());

  await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
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

test('stopListening commits buffered audio and waits for the final transcript', async () => {
  const { onTranscript, result } = await startAndOpenSession();

  await act(async () => {
    result.current.stopListening();
  });

  expect(latestSocket().sent).toContain(JSON.stringify({ type: 'input_audio_buffer.commit' }));
  expect(mockAudioStreamStop).toHaveBeenCalledTimes(1);
  expect(latestSocket().readyState).toBe(MockWebSocket.OPEN);
  expect(onTranscript).not.toHaveBeenCalled();
  expect(result.current.errorMessage).toBeNull();
  expect(result.current.voiceState).toBe('processing');
});

test('stopListening commits buffered audio only once', async () => {
  const { result } = await startAndOpenSession();

  await act(async () => {
    result.current.stopListening();
    result.current.stopListening();
  });

  expect(
    latestSocket().sent.filter(
      (message) => message === JSON.stringify({ type: 'input_audio_buffer.commit' })
    )
  ).toHaveLength(1);
});

test('a completed transcript is submitted only once', async () => {
  const { onTranscript } = await startAndOpenSession();
  const completed = {
    data: JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      transcript: 'Plan a trip to Hue',
    }),
  };

  await act(async () => {
    latestSocket().onmessage?.(completed);
    latestSocket().onmessage?.(completed);
  });

  expect(onTranscript).toHaveBeenCalledTimes(1);
});

test('an empty completed transcript closes the session without submitting', async () => {
  const { onTranscript, result } = await startAndOpenSession();

  await act(async () => result.current.stopListening());
  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: '   ',
      }),
    });
  });

  expect(onTranscript).not.toHaveBeenCalled();
  expect(latestSocket().readyState).toBe(MockWebSocket.CLOSED);
  expect(result.current.voiceState).toBe('idle');
});

test('cancelListening closes the session and ignores a late final transcript', async () => {
  const { onTranscript, result } = await startAndOpenSession();
  const socket = latestSocket();

  await act(async () => {
    (
      result.current as typeof result.current & { cancelListening?: () => void }
    ).cancelListening?.();
  });
  await act(async () => {
    socket.onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'Must be discarded',
      }),
    });
  });

  expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  expect(onTranscript).not.toHaveBeenCalled();
  expect(result.current.voiceState).toBe('idle');
});

test('cancelling while the token is loading prevents the session from opening', async () => {
  const token = deferred<{ token: string; model: string }>();
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
  mockFetchVoiceSessionToken.mockReturnValue(token.promise);
  const { result } = await renderVoiceAssistant();

  await act(async () => {
    result.current.startListening();
    await Promise.resolve();
  });
  await waitFor(() => expect(mockFetchVoiceSessionToken).toHaveBeenCalledTimes(1));

  await act(async () => {
    (
      result.current as typeof result.current & { cancelListening?: () => void }
    ).cancelListening?.();
  });
  await act(async () => {
    token.resolve({ token: 'late-token', model: 'gpt-realtime' });
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(MockWebSocket.instances).toHaveLength(0);
  expect(result.current.voiceState).toBe('idle');
});

test('unmounting while the token is loading prevents the session from opening', async () => {
  const token = deferred<{ token: string; model: string }>();
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
  mockFetchVoiceSessionToken.mockReturnValue(token.promise);
  const { result, unmount } = await renderVoiceAssistant();

  await act(async () => {
    result.current.startListening();
    await Promise.resolve();
  });
  await waitFor(() => expect(mockFetchVoiceSessionToken).toHaveBeenCalledTimes(1));
  await act(async () => unmount());
  await act(async () => {
    token.resolve({ token: 'late-token', model: 'gpt-realtime' });
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(MockWebSocket.instances).toHaveLength(0);
});

test('startListening does nothing while the agent is running', async () => {
  const { result } = await renderHook(() =>
    useVoiceAssistant({
      isAgentRunning: true,
      isVoiceModeActiveRef: { current: true },
      onTranscript: jest.fn(),
    })
  );

  await act(async () => result.current.startListening());

  expect(mockRequestRecordingPermissionsAsync).not.toHaveBeenCalled();
  expect(result.current.voiceState).toBe('idle');
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

test('plays queued speech one segment at a time in source order', async () => {
  const { result } = await renderVoiceAssistant();

  await act(async () => {
    result.current.enqueueSpeech('First sentence.');
    result.current.enqueueSpeech('Second sentence.');
    result.current.flushSpeech();
  });

  expect(mockSpeak).toHaveBeenCalledTimes(1);
  expect(mockSpeak.mock.calls[0][0]).toBe('First sentence.');
  expect(mockSpeak.mock.calls[0][1]).toEqual(expect.objectContaining({ language: 'en-US' }));

  await act(async () => speechOptions(0).onDone?.());

  expect(mockSpeak).toHaveBeenCalledTimes(2);
  expect(mockSpeak.mock.calls[1][0]).toBe('Second sentence.');
  expect(result.current.voiceState).toBe('speaking');

  await act(async () => speechOptions(1).onDone?.());
  expect(result.current.voiceState).toBe('idle');
});

test('uses a Vietnamese TTS voice for Vietnamese assistant text', async () => {
  const { result } = await renderVoiceAssistant();

  await act(async () => {
    result.current.enqueueSpeech('Bạn muốn đi du lịch ở đâu?');
    result.current.flushSpeech();
  });

  expect(mockSpeak.mock.calls[0][1]).toEqual(expect.objectContaining({ language: 'vi-VN' }));
});

test('speech queue ignores empty/whitespace text', async () => {
  const { result } = await renderVoiceAssistant();

  await act(async () => {
    result.current.enqueueSpeech('   ');
    result.current.flushSpeech();
  });

  expect(mockSpeak).not.toHaveBeenCalled();
  expect(result.current.voiceState).toBe('idle');
});

test('stopSpeaking clears pending speech and ignores a stale completion callback', async () => {
  const { result } = await renderVoiceAssistant();

  await act(async () => {
    result.current.enqueueSpeech('First.');
    result.current.enqueueSpeech('Must not play.');
    result.current.flushSpeech();
  });
  const staleDone = speechOptions(0).onDone;

  await act(async () => result.current.stopSpeaking());
  await act(async () => staleDone?.());

  expect(mockSpeak).toHaveBeenCalledTimes(1);
  expect(mockStop).toHaveBeenCalled();
  expect(result.current.voiceState).toBe('idle');
});

test('ignores stale stopped and error callbacks after a new generation starts', async () => {
  const { result } = await renderVoiceAssistant();

  await act(async () => {
    result.current.enqueueSpeech('Old.');
    result.current.flushSpeech();
  });
  const oldOptions = speechOptions(0);

  await act(async () => result.current.stopSpeaking());
  await act(async () => {
    result.current.enqueueSpeech('New.');
    result.current.flushSpeech();
  });
  await act(async () => {
    oldOptions.onStopped?.();
    oldOptions.onError?.();
  });

  expect(result.current.voiceState).toBe('speaking');
  expect(result.current.errorMessage).toBeNull();
});

test('a current TTS error clears the queue and surfaces the playback error', async () => {
  const { result } = await renderVoiceAssistant();

  await act(async () => {
    result.current.enqueueSpeech('Fails.');
    result.current.enqueueSpeech('Must be cleared.');
    result.current.flushSpeech();
  });
  await act(async () => speechOptions(0).onError?.());

  expect(mockSpeak).toHaveBeenCalledTimes(1);
  expect(result.current.voiceState).toBe('error');
  expect(result.current.errorMessage).toMatch(/Couldn't play/);
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
