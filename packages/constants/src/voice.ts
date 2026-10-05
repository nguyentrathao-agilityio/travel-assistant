export const VOICE_TURN_PATH = '/voice/turn';

export const VOICE_TURN_EVENT_TYPES = {
  AGENT_CHUNK: 'agent_chunk',
  AGENT_END: 'agent_end',
  AGENT_INTERRUPT: 'agent_interrupt',
  ERROR: 'error',
  TOOL_CALL: 'tool_call',
  SPEECH_END: 'speech_end',
  SPEECH_SEGMENT: 'speech_segment',
  TOOL_RESULT: 'tool_result',
} as const;

export const VOICE_TURN_ERROR_CODES = {
  AGENT_FAILED: 'agent_failed',
  INVALID_KEY: 'invalid_key',
  INVALID_REQUEST: 'invalid_request',
  MISSING_KEY: 'missing_key',
  THREAD_BUSY: 'thread_busy',
} as const;

export type VoiceTurnErrorCode =
  (typeof VOICE_TURN_ERROR_CODES)[keyof typeof VOICE_TURN_ERROR_CODES];

export const VOICE_AUDIO_PATHS = {
  UPLOAD_URL: '/voice/audio/upload-url',
  COMPLETE: '/voice/audio/complete',
  LIST: '/voice/audio/:threadId',
  PLAYBACK_URL: '/voice/audio/:threadId/:messageId/url',
} as const;

export const VOICE_AUDIO_SAMPLE_RATE = 24000;
export const VOICE_AUDIO_MAX_DURATION_MS = 60000;
export const VOICE_AUDIO_BYTES_PER_SAMPLE = 2;
export const VOICE_AUDIO_WAV_HEADER_BYTES = 44;
export const VOICE_AUDIO_MAX_BYTES =
  (VOICE_AUDIO_MAX_DURATION_MS / 1000) * VOICE_AUDIO_SAMPLE_RATE * VOICE_AUDIO_BYTES_PER_SAMPLE +
  VOICE_AUDIO_WAV_HEADER_BYTES;

export const VOICE_AUDIO_MIME_TYPE = 'audio/wav';
export const VOICE_AUDIO_STORE_NAMESPACE = 'voice-audio';

export const VOICE_AUDIO_ERROR_CODES = {
  INVALID_REQUEST: 'invalid_request',
  MISSING_KEY: 'missing_key',
  NOT_FOUND: 'not_found',
  TOO_LARGE: 'recording_too_large',
  UNAVAILABLE: 'voice_audio_unavailable',
  UPLOAD_MISSING: 'upload_missing',
} as const;
