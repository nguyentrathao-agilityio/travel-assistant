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
