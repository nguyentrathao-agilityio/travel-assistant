export const RUNTIME_URL = import.meta.env.VITE_RUNTIME_URL;
export const COPILOTKIT_PUBLIC_LICENSE_KEY = import.meta.env.VITE_COPILOTKIT_PUBLIC_LICENSE_KEY;
export const AGENT_NAME = 'travelAgent';

export const FETCH_THREADS_DELAY_MS = 1000;
export const FETCH_TITLE_DELAY_MS = 4000;
export const FETCH_TITLE_RETRY_MS = 8000;

export const CHAT_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL: 'tool',
} as const;

export const ALLOWED_CHAT_ROLES = Object.values(CHAT_ROLE);

export const COAGENT_STATE_RENDER_MESSAGE_NAME = 'coagent-state-render';

export const ASSISTANT_MESSAGE_FAILED_TERMS = [
  'unable to',
  "can't",
  'cannot',
  'sorry',
  'failed',
  'error',
];
