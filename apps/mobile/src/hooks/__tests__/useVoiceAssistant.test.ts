import { act, renderHook, waitFor } from '@testing-library/react-native';
import { StrictMode } from 'react';

import { REALTIME_VOICE_WS_URL } from '../../constants';
import { VOICE_RECORDING_MAX_PCM_BYTES } from '../../utils/wav';
import { useVoiceAssistant } from '../useVoiceAssistant';

jest.mock('react-native-reanimated', () => {
  const { useRef } = jest.requireActual('react');

  return {
    useSharedValue: (initial: unknown) => useRef({ value: initial }).current,
    withTiming: (toValue: unknown) => toValue,
  };
});

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
      onTranscript: jest.fn(),
    })
  );

const startAndOpenSession = async (onTranscript: (transcript: string) => void = jest.fn()) => {
  mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
  mockFetchVoiceSessionToken.mockResolvedValue({ token: 'tok-123', model: 'gpt-realtime' });

  const { result, rerender } = await renderHook(
    ({ isAgentRunning }: { isAgentRunning: boolean }) =>
      useVoiceAssistant({ isAgentRunning, onTranscript }),
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

  expect(onTranscript).toHaveBeenCalledWith('Show me hotels in Da Nang', null);
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

  expect(onTranscript).toHaveBeenCalledWith('Show me hotels in Da Nang', null);
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

describe('keepSessionOpenRef (server voice mode)', () => {
  const completed = (transcript: string) => ({
    data: JSON.stringify({
      transcript,
      type: 'conversation.item.input_audio_transcription.completed',
    }),
  });

  const openKeptSession = async (onTranscript = jest.fn()) => {
    mockRequestRecordingPermissionsAsync.mockResolvedValue({ granted: true });
    mockFetchVoiceSessionToken.mockResolvedValue({ token: 'tok-123', model: 'gpt-realtime' });

    const { result } = await renderHook(() =>
      useVoiceAssistant({
        isAgentRunning: false,
        keepSessionOpenRef: { current: true },
        onTranscript,
      })
    );

    await act(async () => result.current.startListening());
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    await act(async () => latestSocket().onopen?.());
    await waitFor(() => expect(result.current.voiceState).toBe('listening'));

    return { onTranscript, result };
  };

  test('parks the session on a final transcript instead of closing it', async () => {
    const { onTranscript, result } = await openKeptSession();
    const socket = latestSocket();

    await act(async () => socket.onmessage?.(completed('Weather in Hue?')));

    expect(onTranscript).toHaveBeenCalledWith('Weather in Hue?', null);
    expect(socket.readyState).toBe(MockWebSocket.OPEN);
    expect(mockAudioStreamStop).toHaveBeenCalled();
    expect(result.current.voiceState).toBe('idle');
  });

  test('resumes the parked session without reconnecting', async () => {
    const { result } = await openKeptSession();
    const socket = latestSocket();

    await act(async () => socket.onmessage?.(completed('Weather in Hue?')));
    mockAudioStreamStart.mockClear();
    await act(async () => result.current.startListening());

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(mockFetchVoiceSessionToken).toHaveBeenCalledTimes(1);
    expect(socket.sent.at(-1)).toBe(JSON.stringify({ type: 'input_audio_buffer.clear' }));
    expect(mockAudioStreamStart).toHaveBeenCalledTimes(1);
    expect(result.current.voiceState).toBe('listening');
  });

  test('delivers the next turn from the resumed session', async () => {
    const { onTranscript, result } = await openKeptSession();
    const socket = latestSocket();

    await act(async () => socket.onmessage?.(completed('First question')));
    await act(async () => result.current.startListening());
    await act(async () => socket.onmessage?.(completed('Second question')));

    expect(onTranscript).toHaveBeenNthCalledWith(2, 'Second question', null);
  });

  test('keeps listening on an empty final transcript', async () => {
    const { onTranscript, result } = await openKeptSession();
    const socket = latestSocket();

    await act(async () => socket.onmessage?.(completed('   ')));

    expect(onTranscript).not.toHaveBeenCalled();
    expect(socket.readyState).toBe(MockWebSocket.OPEN);
    expect(result.current.voiceState).toBe('listening');
  });

  test('keeps listening when a manual stop commits an empty buffer', async () => {
    const { result } = await openKeptSession();
    const socket = latestSocket();

    await act(async () => result.current.stopListening());
    mockAudioStreamStart.mockClear();
    await act(async () =>
      socket.onmessage?.({
        data: JSON.stringify({
          error: { code: 'input_audio_buffer_commit_empty', message: 'buffer too small' },
          type: 'error',
        }),
      })
    );

    expect(socket.readyState).toBe(MockWebSocket.OPEN);
    expect(mockAudioStreamStart).toHaveBeenCalledTimes(1);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.voiceState).toBe('listening');
  });

  test('reconnects when the parked session was closed (expiry or network)', async () => {
    const { result } = await openKeptSession();
    const socket = latestSocket();

    await act(async () => socket.onmessage?.(completed('First question')));
    await act(async () => socket.close());

    expect(result.current.errorMessage).toBeNull();

    await act(async () => result.current.startListening());
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(2));

    expect(result.current.voiceState).toBe('connecting');
  });

  test('cancelListening still closes a parked session', async () => {
    const { result } = await openKeptSession();
    const socket = latestSocket();

    await act(async () => socket.onmessage?.(completed('First question')));
    await act(async () => result.current.cancelListening());

    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });
});

const emitFinalTranscript = async (transcript: string) => {
  await act(async () => {
    latestSocket().onmessage?.({
      data: JSON.stringify({
        type: 'conversation.item.input_audio_transcription.completed',
        transcript,
      }),
    });
  });
};

const pushAudio = async (byteLength: number) => {
  await act(async () => {
    capturedOnBuffer?.({ data: new ArrayBuffer(byteLength) });
  });
};

test('hands the utterance audio to onTranscript and starts a fresh buffer for the next one', async () => {
  const onTranscript = jest.fn();

  await startAndOpenSession(onTranscript);
  await pushAudio(4);
  await pushAudio(4);
  await emitFinalTranscript('hi');

  expect(onTranscript).toHaveBeenCalledWith('hi', {
    byteLength: 8,
    chunks: [expect.any(ArrayBuffer), expect.any(ArrayBuffer)],
  });
});

test('caps the buffered audio at the max duration', async () => {
  const onTranscript = jest.fn();

  await startAndOpenSession(onTranscript);
  await pushAudio(VOICE_RECORDING_MAX_PCM_BYTES - 50);
  await pushAudio(150);
  await emitFinalTranscript('long');

  expect(onTranscript.mock.calls[0]![1].byteLength).toBe(VOICE_RECORDING_MAX_PCM_BYTES);
});
