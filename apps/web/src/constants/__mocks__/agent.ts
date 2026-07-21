export const RUNTIME_URL = 'http://localhost';
export const COPILOTKIT_PUBLIC_LICENSE_KEY = 'test-key';
export const AGENT_NAME = 'travelAgent';
export const FETCH_THREADS_DELAY_MS = 0;
export const FETCH_TITLE_DELAY_MS = 0;
export const FETCH_TITLE_RETRY_MS = 0;
export const CHAT_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL: 'tool',
} as const;
export const ALLOWED_CHAT_ROLES = Object.values(CHAT_ROLE);
export const ASSISTANT_MESSAGE_FAILED_TERMS: string[] = [];
