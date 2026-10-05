export const REALTIME_VOICE_MODEL = 'gpt-4o-mini-transcribe';
export const REALTIME_VOICE_SESSION_TTL_SECONDS = 300;
export const OPENAI_REALTIME_CLIENT_SECRETS_URL =
  'https://api.openai.com/v1/realtime/client_secrets';

// Device TTS speaks each segment as its own utterance, so very short ones sound choppy.
export const VOICE_SPEECH_MIN_SEGMENT_CHARS = 40;
// Internal to the speech stage: speak buffered text now; never sent to the client.
export const VOICE_SPEECH_FLUSH_EVENT_TYPE = 'speech_flush';
export const VOICE_APPROVAL_PROMPT_TEXT = 'Please confirm the booking on screen.';

export const VOICE_RESPONDER_NODES: ReadonlySet<string> = new Set([
  'explore',
  'plan',
  'booking',
  'general',
  'refusal',
]);

export const VOICE_SUBGRAPH_ACTIVITY_KEYS: ReadonlySet<string> = new Set([
  'model_request',
  'tools',
]);

export const VOICE_RUNNER_ERROR_MESSAGES = {
  AGENT_FAILED: 'The assistant could not finish this turn.',
  INVALID_KEY: 'The OpenAI API key was rejected.',
  THREAD_BUSY: 'Another reply is still running in this chat.',
} as const;

export const VOICE_RUN_EVENT_KINDS = {
  INTERRUPT: 'interrupt',
  TEXT: 'text',
  TEXT_END: 'text_end',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
} as const;

export const VOICE_RUN_REQUEST_KINDS = {
  INPUT: 'input',
  RESUME: 'resume',
} as const;

export const LANGGRAPH_STREAM_EVENTS = {
  ERROR: 'error',
  MESSAGES: 'messages',
  UPDATES: 'updates',
} as const;

export const LANGGRAPH_INTERRUPT_KEY = '__interrupt__';

export const LANGGRAPH_MESSAGE_TYPES = {
  AI: 'ai',
  AI_CHUNK: 'AIMessageChunk',
  TOOL: 'tool',
} as const;

export const VOICE_RUN_STREAM_OPTIONS = {
  ifNotExists: 'create',
  multitaskStrategy: 'reject',
  onDisconnect: 'cancel',
  streamMode: ['messages-tuple', 'updates'],
  streamSubgraphs: true,
} as const;

export const VOICE_INVALID_KEY_ERROR_PATTERN = /api key|401|invalid_api_key/i;

export const VOICE_AUDIO_ROUTE_PATTERN = '/voice/audio/*';
export const VOICE_AUDIO_OBJECT_PREFIX = 'voice';
export const VOICE_AUDIO_FILE_EXTENSION = 'wav';
export const VOICE_AUDIO_UPLOAD_URL_TTL_SECONDS = 300;
export const VOICE_AUDIO_PLAYBACK_URL_TTL_SECONDS = 900;
export const VOICE_AUDIO_LIST_LIMIT = 1000;
