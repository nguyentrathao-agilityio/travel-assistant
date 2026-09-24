export const MODERATION_MODEL = 'omni-moderation-latest';
export const MODERATION_VIOLATION_MESSAGE = "I can't help with that request.";

export const OBSERVABILITY_EVENT = '[agent-observability]';
export const OBSERVABILITY_OPERATIONS = {
  MODEL: 'model',
  TOOL: 'tool',
} as const;
export const OBSERVABILITY_STATUSES = {
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export const UNKNOWN_ERROR_TYPE = 'UnknownError';
export const UNKNOWN_TOOL_NAME = 'unknownTool';
export const RICH_UI_MIDDLEWARE_NAME = 'RichUiModelContent';

export const SUMMARIZATION_TRIGGER_MESSAGES = 20;
export const SUMMARIZATION_KEEP_MESSAGES = 10;

export const MODEL_RETRY_MAX_RETRIES = 1;
export const TOOL_CALL_RUN_LIMIT = 15;
