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

// Amplifies normalized PCM RMS into a useful 0..1 range for the waveform.
export const MIC_LEVEL_GAIN = 5;

export const VOICE_ERROR_MESSAGES = {
  CONNECTING_TIMEOUT: 'Connecting is taking too long. Please try again.',
  NO_SPEECH: "Didn't catch that — try again or type your question.",
  PERMISSION_DENIED:
    'Microphone access is off. Enable it in Settings to use voice, or keep typing.',
  STT_UNAVAILABLE: "Voice input isn't available right now — please type instead.",
  TTS_FAILED: "Couldn't play the response out loud.",
} as const;

export const VOICE_STATE_LABEL: Record<VoiceState, string> = {
  [VOICE_STATES.CONNECTING]: 'Connecting…',
  [VOICE_STATES.ERROR]: 'Something went wrong',
  [VOICE_STATES.IDLE]: 'Tap the mic to talk',
  [VOICE_STATES.LISTENING]: 'Listening…',
  [VOICE_STATES.SPEAKING]: 'Speaking…',
  [VOICE_STATES.THINKING]: 'Thinking…',
};

export const VOICE_BAR_MULTIPLIERS = [0.35, 0.65, 1, 0.65, 0.35];
export const VOICE_BAR_MIN_HEIGHT = 10;
export const VOICE_BAR_MAX_HEIGHT = 72;
