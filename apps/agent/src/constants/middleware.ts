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
