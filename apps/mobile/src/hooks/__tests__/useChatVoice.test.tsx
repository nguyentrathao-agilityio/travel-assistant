import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';

import { VOICE_ERROR_MESSAGES } from '../../constants';
import { useChatVoice } from '../useChatVoice';

const mockVoice = {
  errorMessage: null as string | null,
  micLevel: { value: 0 },
  partialTranscript: '',
  startListening: jest.fn(),
  stopListening: jest.fn(),
  voiceState: 'idle',
};
const mockTurn = {
  agentTranscript: '',
  errorMessage: null as string | null,
  isRunning: false,
  isSpeaking: false,
  pendingApproval: null as unknown,
  respondToApproval: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};
let mockVoiceModeActive = true;
let capturedVoiceOptions:
  | {
      keepSessionOpenRef?: { current: boolean };
      onTranscript(text: string, recording?: unknown): void;
    }
  | undefined;
let capturedTurnOptions: { onFinished?(): void; onSettled?(): void; threadId: string } | undefined;
const mockStartVoiceMode = jest.fn();

jest.mock('../useVoiceAssistant', () => ({
  useVoiceAssistant: (options: {
    keepSessionOpenRef?: { current: boolean };
    onTranscript(text: string, recording?: unknown): void;
  }) => {
    capturedVoiceOptions = options;

    return mockVoice;
  },
}));

jest.mock('../useVoiceTurn', () => ({
  useVoiceTurn: (options: { onFinished?(): void; onSettled?(): void; threadId: string }) => {
    capturedTurnOptions = options;

    return mockTurn;
  },
}));

jest.mock('../useVoiceModeConversation', () => ({
  useVoiceModeConversation: () => ({
    isActive: mockVoiceModeActive,
    start: mockStartVoiceMode,
    stop: jest.fn(),
  }),
}));

const mockUploadVoiceRecording = jest.fn();

jest.mock('expo-crypto', () => ({ randomUUID: () => 'm-uuid' }));
jest.mock('../../services/voiceAudio', () => ({
  uploadVoiceRecording: (...args: unknown[]) => mockUploadVoiceRecording(...args),
}));

const onTurnSettled = jest.fn();
let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const render = () =>
  renderHook(
    () =>
      useChatVoice({
        autoStart: false,
        isHistoryLoading: false,
        isReady: true,
        isRunning: false,
        onTurnSettled,
        threadId: 'thread-1',
      }),
    { wrapper }
  );

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient();
  mockUploadVoiceRecording.mockResolvedValue(undefined);
  mockVoiceModeActive = true;
  Object.assign(mockVoice, { errorMessage: null, voiceState: 'idle' });
  Object.assign(mockTurn, {
    agentTranscript: '',
    errorMessage: null,
    isRunning: false,
    isSpeaking: false,
    pendingApproval: null,
  });
});

test('voice mode sends transcripts to the voice turn', async () => {
  await render();

  await act(async () => capturedVoiceOptions!.onTranscript('weather?'));

  expect(mockTurn.start).toHaveBeenCalledWith('weather?', 'm-uuid');
  expect(capturedTurnOptions).toMatchObject({ onSettled: onTurnSettled, threadId: 'thread-1' });
});

test('dictation still goes to the composer', async () => {
  mockVoiceModeActive = false;
  const { result } = await render();

  await act(async () => capturedVoiceOptions!.onTranscript('hello'));

  expect(mockTurn.start).not.toHaveBeenCalled();
  expect(result.current.dictatedTranscript?.text).toBe('hello');
});

test('listening resumes when the turn has finished speaking', async () => {
  await render();

  await act(async () => capturedTurnOptions!.onFinished!());

  expect(mockVoice.startListening).toHaveBeenCalledTimes(1);
});

test('derives the overlay state from the turn first, then STT', async () => {
  const { result, rerender } = await render();

  expect(result.current.voiceState).toBe('idle');

  mockTurn.isRunning = true;
  await rerender({});
  expect(result.current.voiceState).toBe('thinking');

  mockTurn.isSpeaking = true;
  await rerender({});
  expect(result.current.voiceState).toBe('speaking');

  mockTurn.pendingApproval = { actionRequests: [] };
  mockTurn.agentTranscript = 'Here is the quote';
  await rerender({});
  expect(result.current.voiceState).toBe('awaiting_approval');
  expect(result.current.pendingApproval).toEqual({ actionRequests: [] });
  expect(result.current.agentTranscript).toBe('Here is the quote');
});

test('interrupt stops the turn and listens again; exit stops the turn', async () => {
  mockTurn.isSpeaking = true;
  const { result } = await render();

  await act(async () => result.current.onStopVoiceModeTurn());

  expect(mockTurn.stop).toHaveBeenCalledTimes(1);
  expect(mockVoice.startListening).toHaveBeenCalledTimes(1);

  await act(async () => result.current.onExitVoiceMode());

  expect(mockTurn.stop).toHaveBeenCalledTimes(2);
});

test('approval decisions resume the voice turn', async () => {
  const { result } = await render();

  await act(async () => result.current.onApprovalDecision({ decisions: [] }));

  expect(mockTurn.respondToApproval).toHaveBeenCalledWith({ decisions: [] });
});

test('a voice-mode STT session with no speech restarts listening instead of dead-ending', async () => {
  const { rerender } = await render();

  Object.assign(mockVoice, { errorMessage: VOICE_ERROR_MESSAGES.NO_SPEECH, voiceState: 'error' });
  await rerender({});

  expect(mockVoice.startListening).toHaveBeenCalledTimes(1);

  await rerender({});

  expect(mockVoice.startListening).toHaveBeenCalledTimes(1);
});

test('a voice-mode STT session that ends silently (idle, no error) restarts listening', async () => {
  Object.assign(mockVoice, { voiceState: 'listening' });
  const { rerender } = await render();

  Object.assign(mockVoice, { voiceState: 'idle' });
  await rerender({});

  expect(mockVoice.startListening).toHaveBeenCalledTimes(1);
});

test('stops auto-restarting after three silent sessions in a row', async () => {
  const { rerender } = await render();

  for (let index = 0; index < 5; index += 1) {
    Object.assign(mockVoice, { voiceState: 'listening' });
    await rerender({});
    Object.assign(mockVoice, { voiceState: 'idle' });
    await rerender({});
  }

  expect(mockVoice.startListening).toHaveBeenCalledTimes(3);
});

test('exiting with a pending approval hands it back to the chat', async () => {
  const onExitWithPendingApproval = jest.fn();
  mockTurn.pendingApproval = { actionRequests: [] };
  const { result } = await renderHook(
    () =>
      useChatVoice({
        autoStart: false,
        isHistoryLoading: false,
        isReady: true,
        isRunning: false,
        onExitWithPendingApproval,
        onTurnSettled,
        threadId: 'thread-1',
      }),
    { wrapper }
  );

  await act(async () => result.current.onExitVoiceMode());

  expect(mockTurn.stop).toHaveBeenCalled();
  expect(onExitWithPendingApproval).toHaveBeenCalledTimes(1);
});

test('exiting without a pending approval does not touch the chat run', async () => {
  const onExitWithPendingApproval = jest.fn();
  const { result } = await renderHook(
    () =>
      useChatVoice({
        autoStart: false,
        isHistoryLoading: false,
        isReady: true,
        isRunning: false,
        onExitWithPendingApproval,
        threadId: 'thread-1',
      }),
    { wrapper }
  );

  await act(async () => result.current.onExitVoiceMode());

  expect(onExitWithPendingApproval).not.toHaveBeenCalled();
});

test('keeps the STT session open in voice mode only', async () => {
  mockVoiceModeActive = false;
  const { result } = await render();

  expect(capturedVoiceOptions!.keepSessionOpenRef?.current).toBe(false);

  await act(async () => result.current.onStartVoiceMode());

  expect(capturedVoiceOptions!.keepSessionOpenRef?.current).toBe(true);

  await act(async () => result.current.onExitVoiceMode());

  expect(capturedVoiceOptions!.keepSessionOpenRef?.current).toBe(false);
});

test('route auto-start enters voice mode instead of composer dictation', async () => {
  await renderHook(
    () =>
      useChatVoice({
        autoStart: true,
        isHistoryLoading: false,
        isReady: true,
        isRunning: false,
        threadId: 'thread-1',
      }),
    { wrapper }
  );

  expect(mockStartVoiceMode).toHaveBeenCalledTimes(1);
  expect(mockVoice.startListening).not.toHaveBeenCalled();
});

test('voice mode is flagged before start(), so the first transcript keeps the session open', async () => {
  let keepOpenAtStart: boolean | undefined;

  mockVoiceModeActive = false;
  mockStartVoiceMode.mockImplementation(() => {
    keepOpenAtStart = capturedVoiceOptions!.keepSessionOpenRef?.current;
  });
  const { result } = await render();

  await act(async () => result.current.onStartVoiceMode());

  expect(keepOpenAtStart).toBe(true);
});

const recording = { byteLength: 4, chunks: [new ArrayBuffer(4)] };

test('uploads the voice-mode recording under the new message id', async () => {
  await render();

  await act(async () => capturedVoiceOptions!.onTranscript('hi', recording));

  expect(mockTurn.start).toHaveBeenCalledWith('hi', 'm-uuid');
  expect(mockUploadVoiceRecording).toHaveBeenCalledWith({
    messageId: 'm-uuid',
    recording,
    threadId: 'thread-1',
  });
});

test('invalidates the voice audio list after a successful upload', async () => {
  await render();
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

  await act(async () => capturedVoiceOptions!.onTranscript('hi', recording));

  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['threads', 'voice-audio', 'thread-1'] });
});

test('a failed upload is logged and never blocks the turn', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  mockUploadVoiceRecording.mockRejectedValue(new Error('bucket down'));
  await render();

  await act(async () => capturedVoiceOptions!.onTranscript('hi', recording));

  expect(mockTurn.start).toHaveBeenCalledWith('hi', 'm-uuid');
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

test('never uploads dictation', async () => {
  mockVoiceModeActive = false;
  await render();

  await act(async () => capturedVoiceOptions!.onTranscript('hi', recording));

  expect(mockUploadVoiceRecording).not.toHaveBeenCalled();
  expect(mockTurn.start).not.toHaveBeenCalled();
});
