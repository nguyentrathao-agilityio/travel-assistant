import { VOICE_TURN_ERROR_CODES } from '@repo/constants';

export const VOICE_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  AWAITING_APPROVAL: 'awaiting_approval',
  ERROR: 'error',
} as const;

export type VoiceState = (typeof VOICE_STATES)[keyof typeof VOICE_STATES];
export type VoiceWebSocketPhase =
  | typeof VOICE_STATES.IDLE
  | typeof VOICE_STATES.CONNECTING
  | typeof VOICE_STATES.LISTENING
  | typeof VOICE_STATES.PROCESSING;

export const VOICE_LOCALE = 'en-US';
export const VIETNAMESE_VOICE_LOCALE = 'vi-VN';

export const REALTIME_VOICE_WS_URL = 'wss://api.openai.com/v1/realtime';
export const REALTIME_VOICE_SAMPLE_RATE = 24000;
export const REALTIME_EMPTY_COMMIT_ERROR_CODE = 'input_audio_buffer_commit_empty';
export const VOICE_CONNECTING_TIMEOUT_MS = 15000;

// Amplifies normalized PCM RMS into a useful 0..1 range for the waveform.
export const MIC_LEVEL_GAIN = 5;

export const VOICE_ERROR_MESSAGES = {
  CONNECTING_TIMEOUT: 'Connecting is taking too long. Please try again.',
  NO_SPEECH: "Didn't catch that — try again or type your question.",
  PERMISSION_DENIED:
    'Microphone access is off. Enable it in Settings to use voice, or keep typing.',
  STT_UNAVAILABLE: "Voice input isn't available right now — please type instead.",
  INVALID_KEY: 'Your OpenAI key was rejected — update it in Settings.',
  THREAD_BUSY: 'Still finishing the previous reply — try again in a moment.',
  AGENT_FAILED: "Couldn't finish that reply. The chat has what was saved.",
  CONNECTION_LOST: 'Voice connection lost. Tap the mic to try again.',
} as const;

export const VOICE_STATE_LABEL: Record<VoiceState, string> = {
  [VOICE_STATES.CONNECTING]: 'Connecting…',
  [VOICE_STATES.ERROR]: 'Something went wrong',
  [VOICE_STATES.IDLE]: 'Tap the mic to talk',
  [VOICE_STATES.LISTENING]: 'Listening…',
  [VOICE_STATES.PROCESSING]: 'Processing…',
  [VOICE_STATES.SPEAKING]: 'Speaking…',
  [VOICE_STATES.THINKING]: 'Thinking…',
  [VOICE_STATES.AWAITING_APPROVAL]: 'Confirm the booking below',
};

export const VOICE_BAR_MULTIPLIERS = [0.35, 0.65, 1, 0.65, 0.35];
export const VOICE_BAR_MIN_HEIGHT = 10;
export const VOICE_BAR_MAX_HEIGHT = 72;

export const VOICE_MAX_SILENT_RESTARTS = 3;
export const VOICE_TURN_FALLBACK_ERROR = 'voice_turn_failed';
export const VOICE_TURN_MISSING_KEY_STATUS = 400;
export const SSE_DATA_PREFIX = 'data:';

export const VOICE_KEY_ERROR_CODES: ReadonlySet<unknown> = new Set([
  VOICE_TURN_ERROR_CODES.INVALID_KEY,
  VOICE_TURN_ERROR_CODES.MISSING_KEY,
]);

export const VOICE_STT_SESSION_STATES: ReadonlySet<VoiceState> = new Set([
  VOICE_STATES.CONNECTING,
  VOICE_STATES.LISTENING,
  VOICE_STATES.PROCESSING,
]);

export const VOICE_REPLY_CAPTION_STATES: ReadonlySet<VoiceState> = new Set([
  VOICE_STATES.THINKING,
  VOICE_STATES.SPEAKING,
  VOICE_STATES.AWAITING_APPROVAL,
]);
