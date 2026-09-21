export const VOICE_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error',
} as const;

export type VoiceState = (typeof VOICE_STATES)[keyof typeof VOICE_STATES];
export type VoiceWebSocketPhase =
  | typeof VOICE_STATES.IDLE
  | typeof VOICE_STATES.CONNECTING
  | typeof VOICE_STATES.LISTENING;

export const VOICE_LOCALE = 'en-US';

export const REALTIME_VOICE_WS_URL = 'wss://api.openai.com/v1/realtime';
export const REALTIME_VOICE_SAMPLE_RATE = 24000;
export const VOICE_CONNECTING_TIMEOUT_MS = 15000;

export const VOICE_ERROR_MESSAGES = {
  CONNECTING_TIMEOUT: 'Connecting is taking too long. Please try again.',
  NO_SPEECH: "Didn't catch that — try again or type your question.",
  PERMISSION_DENIED:
    'Microphone access is off. Enable it in Settings to use voice, or keep typing.',
  STT_UNAVAILABLE: "Voice input isn't available right now — please type instead.",
  TTS_FAILED: "Couldn't play the response out loud.",
} as const;
