import { VOICE_TURN_ERROR_CODES } from '@repo/constants';
import { VoiceTurnEventSchema, type VoiceTurnEvent } from '@repo/schemas';

import {
  REALTIME_EMPTY_COMMIT_ERROR_CODE,
  VOICE_ERROR_MESSAGES,
  VOICE_KEY_ERROR_CODES,
  VOICE_STATES,
  VIETNAMESE_VOICE_LOCALE,
  VOICE_LOCALE,
  VOICE_TURN_FALLBACK_ERROR,
  type VoiceState,
  type VoiceWebSocketPhase,
} from '../constants';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const VIETNAMESE_TEXT_PATTERN = /[ĂăÂâĐđÊêÔôƠơƯư\u1EA0-\u1EF9]/u;

interface RealtimeVoiceMessage {
  type?: unknown;
  transcript?: unknown;
  delta?: unknown;
  item?: { content?: Array<{ transcript?: unknown }> };
  error?: { code?: unknown; message?: unknown };
}

export interface VoiceStateContext {
  errorMessage: string | null;
  wsPhase: VoiceWebSocketPhase;
}

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

export const voiceLocaleForText = (text: string): string =>
  VIETNAMESE_TEXT_PATTERN.test(text) ? VIETNAMESE_VOICE_LOCALE : VOICE_LOCALE;

const parseRealtimeMessage = (raw: string): RealtimeVoiceMessage | null => {
  try {
    const message: unknown = JSON.parse(raw);

    return typeof message === 'object' && message !== null ? message : null;
  } catch {
    return null;
  }
};

const isTranscriptionEvent = (
  message: RealtimeVoiceMessage | null,
  suffix: 'completed' | 'delta'
): message is RealtimeVoiceMessage =>
  typeof message?.type === 'string' &&
  message.type.includes('transcription') &&
  message.type.endsWith(suffix);

// Extracts the final transcript from a realtime provider event.
export const extractFinalTranscript = (raw: string): string | null => {
  const message = parseRealtimeMessage(raw);

  if (!isTranscriptionEvent(message, 'completed')) return null;

  const transcript =
    typeof message.transcript === 'string'
      ? message.transcript
      : message.item?.content?.find((part) => typeof part.transcript === 'string')?.transcript;

  return typeof transcript === 'string' && transcript.trim().length > 0 ? transcript.trim() : null;
};

export const isFinalTranscriptEvent = (raw: string): boolean =>
  isTranscriptionEvent(parseRealtimeMessage(raw), 'completed');

// Extracts an append-only partial transcript from a realtime event.
export const extractTranscriptDelta = (raw: string): string | null => {
  const message = parseRealtimeMessage(raw);

  if (!isTranscriptionEvent(message, 'delta')) return null;

  return typeof message.delta === 'string' && message.delta.length > 0 ? message.delta : null;
};

// Extracts a provider error message with a safe fallback.
export const extractRealtimeErrorMessage = (raw: string): string | null => {
  const message = parseRealtimeMessage(raw);

  if (message?.type !== 'error') return null;

  return typeof message.error?.message === 'string'
    ? message.error.message
    : 'Realtime voice session error';
};

// True when a manual commit found no audio left to transcribe.
export const isEmptyCommitError = (raw: string): boolean => {
  const message = parseRealtimeMessage(raw);

  return message?.type === 'error' && message.error?.code === REALTIME_EMPTY_COMMIT_ERROR_CODE;
};

// Resolves the highest-priority UI state for the current voice session.
export const resolveVoiceState = ({ errorMessage, wsPhase }: VoiceStateContext): VoiceState =>
  errorMessage ? VOICE_STATES.ERROR : wsPhase;

export interface ServerTurnState {
  isRunning: boolean;
  isSpeaking: boolean;
  pendingApproval: unknown | null;
}

/** Overlay state in server mode: the voice turn (approval > speaking > thinking) wins over STT. */
export const resolveServerVoiceState = (
  turn: ServerTurnState,
  sttState: VoiceState
): VoiceState => {
  if (turn.pendingApproval) return VOICE_STATES.AWAITING_APPROVAL;
  if (turn.isSpeaking) return VOICE_STATES.SPEAKING;
  if (turn.isRunning) return VOICE_STATES.THINKING;

  return sttState;
};

/** Message for an `agent_end` error code. */
export const voiceTurnErrorMessage = (code: string): string => {
  if (code === VOICE_TURN_ERROR_CODES.INVALID_KEY) return VOICE_ERROR_MESSAGES.INVALID_KEY;
  if (code === VOICE_TURN_ERROR_CODES.THREAD_BUSY) return VOICE_ERROR_MESSAGES.THREAD_BUSY;

  return VOICE_ERROR_MESSAGES.AGENT_FAILED;
};

/** Message for a voice turn request that failed before or while streaming. */
export const voiceTurnRequestErrorMessage = (error: unknown): string =>
  VOICE_KEY_ERROR_CODES.has((error as { code?: unknown } | null)?.code)
    ? VOICE_ERROR_MESSAGES.INVALID_KEY
    : VOICE_ERROR_MESSAGES.CONNECTION_LOST;

/** Parses one SSE `data` payload into a voice turn event, or `null` if it is not one. */
export const parseVoiceTurnEvent = (data: string): VoiceTurnEvent | null => {
  try {
    const parsed = VoiceTurnEventSchema.safeParse(JSON.parse(data));

    // Skip rather than throw, so a newer server event type cannot break an older app.
    if (!parsed.success) console.warn('[voice] Skipping unknown voice turn event.', parsed.error);

    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.warn('[voice] Skipping malformed voice turn event.', error);

    return null;
  }
};

/** Reads the error code from a failed `/voice/turn` response body. */
export const readVoiceTurnErrorCode = async (response: Response): Promise<string> => {
  try {
    const { error } = (await response.json()) as { error?: unknown };

    return typeof error === 'string' ? error : VOICE_TURN_FALLBACK_ERROR;
  } catch (error) {
    console.warn('[voice] Unreadable voice turn error response.', error);

    return VOICE_TURN_FALLBACK_ERROR;
  }
};

/** Formats a recording length as `m:ss`, rounding up so a short clip never reads `0:00`. */
export const formatClipDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(1, Math.ceil(durationMs / 1000));

  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
};
