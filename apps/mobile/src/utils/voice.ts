import { VOICE_STATES, type VoiceState, type VoiceWebSocketPhase } from '../constants';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

interface RealtimeVoiceMessage {
  type?: unknown;
  transcript?: unknown;
  delta?: unknown;
  item?: { content?: Array<{ transcript?: unknown }> };
  error?: { message?: unknown };
}

export interface StreamingSpeechState {
  messageId: string | null;
  observedText: string;
  pendingText: string;
  completed: boolean;
}

interface StreamingSpeechSnapshot {
  messageId: string;
  text: string;
  isComplete: boolean;
}

interface StreamingSpeechUpdate {
  state: StreamingSpeechState;
  segments: string[];
}

export interface VoiceStateContext {
  errorMessage: string | null;
  isAgentRunning: boolean;
  isSpeaking: boolean;
  isVoiceTurnActive: boolean;
  wsPhase: VoiceWebSocketPhase;
}

const VOICE_STATE_RULES: Record<VoiceState, (context: VoiceStateContext) => boolean> = {
  [VOICE_STATES.ERROR]: ({ errorMessage }) => Boolean(errorMessage),
  [VOICE_STATES.SPEAKING]: ({ isSpeaking }) => isSpeaking,
  [VOICE_STATES.CONNECTING]: ({ wsPhase }) => wsPhase === VOICE_STATES.CONNECTING,
  [VOICE_STATES.LISTENING]: ({ wsPhase }) => wsPhase === VOICE_STATES.LISTENING,
  [VOICE_STATES.THINKING]: ({ isAgentRunning, isVoiceTurnActive }) =>
    isVoiceTurnActive && isAgentRunning,
  [VOICE_STATES.IDLE]: () => true,
};

// Normalizes text before sending it to device TTS.
const normalizeSegment = (text: string): string => text.replace(/\s+/g, ' ').trim();

// Splits complete sentences from the trailing partial text.
const takeCompletedSegments = (input: string): { pending: string; segments: string[] } => {
  const segments: string[] = [];
  let start = 0;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (character !== '.' && character !== '!' && character !== '?' && character !== '\n') {
      continue;
    }

    const segment = normalizeSegment(input.slice(start, index + (character === '\n' ? 0 : 1)));

    if (segment) segments.push(segment);
    start = index + 1;
  }

  return { pending: input.slice(start), segments };
};

// Converts PCM samples into an amplified 0..1 waveform level.
export const calculateMicLevel = (buffer: ArrayBuffer, gain: number): number => {
  const samples = new Int16Array(buffer, 0, Math.floor(buffer.byteLength / 2));
  let sumSquares = 0;

  for (const sample of samples) sumSquares += sample * sample;

  const rms = samples.length > 0 ? Math.sqrt(sumSquares / samples.length) / 32768 : 0;

  return Math.min(rms * gain, 1);
};

/** Encodes raw PCM bytes to base64 without relying on `btoa`, which isn't guaranteed on Hermes. */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    const byte3 = bytes[i + 2];

    result += BASE64_CHARS[byte1 >> 2];
    result += BASE64_CHARS[((byte1 & 0x03) << 4) | (byte2 === undefined ? 0 : byte2 >> 4)];
    result +=
      byte2 === undefined
        ? '='
        : BASE64_CHARS[((byte2 & 0x0f) << 2) | (byte3 === undefined ? 0 : byte3 >> 6)];
    result += byte3 === undefined ? '=' : BASE64_CHARS[byte3 & 0x3f];
  }

  return result;
};

// Extracts the final transcript from a realtime provider event.
export const extractFinalTranscript = (raw: string): string | null => {
  let message: RealtimeVoiceMessage;

  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof message.type !== 'string') return null;
  if (!message.type.includes('transcription') || !message.type.endsWith('completed')) return null;

  const transcript =
    typeof message.transcript === 'string'
      ? message.transcript
      : message.item?.content?.find((part) => typeof part.transcript === 'string')?.transcript;

  return typeof transcript === 'string' && transcript.trim().length > 0 ? transcript.trim() : null;
};

// Extracts an append-only partial transcript from a realtime event.
export const extractTranscriptDelta = (raw: string): string | null => {
  let message: RealtimeVoiceMessage;

  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof message.type !== 'string') return null;
  if (!message.type.includes('transcription') || !message.type.endsWith('delta')) return null;

  return typeof message.delta === 'string' && message.delta.length > 0 ? message.delta : null;
};

// Extracts a provider error message with a safe fallback.
export const extractRealtimeErrorMessage = (raw: string): string | null => {
  let message: RealtimeVoiceMessage;

  try {
    message = JSON.parse(raw);
  } catch {
    return null;
  }

  if (message.type !== 'error') return null;

  return typeof message.error?.message === 'string'
    ? message.error.message
    : 'Realtime voice session error';
};

// Creates an empty state for a new streamed assistant response.
export const createStreamingSpeechState = (): StreamingSpeechState => ({
  completed: false,
  messageId: null,
  observedText: '',
  pendingText: '',
});

// Resets sentence streaming between voice turns.
export const resetStreamingSpeech = (): StreamingSpeechState => createStreamingSpeechState();

// Emits only newly completed speech segments from a growing response.
export const collectStreamingSpeech = (
  state: StreamingSpeechState,
  snapshot: StreamingSpeechSnapshot
): StreamingSpeechUpdate => {
  if (state.messageId !== snapshot.messageId) state = createStreamingSpeechState();

  const current = { ...state, messageId: snapshot.messageId };

  if (current.completed) return { segments: [], state: current };

  if (!snapshot.text.startsWith(current.observedText)) {
    return {
      segments: [],
      state: {
        ...current,
        completed: snapshot.isComplete,
        observedText: snapshot.text,
        pendingText: '',
      },
    };
  }

  const appended = snapshot.text.slice(current.observedText.length);
  const extracted = takeCompletedSegments(current.pendingText + appended);
  const trailing = snapshot.isComplete ? normalizeSegment(extracted.pending) : '';

  return {
    segments: trailing ? [...extracted.segments, trailing] : extracted.segments,
    state: {
      completed: snapshot.isComplete,
      messageId: snapshot.messageId,
      observedText: snapshot.text,
      pendingText: snapshot.isComplete ? '' : extracted.pending,
    },
  };
};

// Resolves the highest-priority UI state for the current voice session.
export const resolveVoiceState = (context: VoiceStateContext): VoiceState =>
  (Object.entries(VOICE_STATE_RULES).find(([, matches]) => matches(context))?.[0] as VoiceState) ??
  VOICE_STATES.IDLE;
