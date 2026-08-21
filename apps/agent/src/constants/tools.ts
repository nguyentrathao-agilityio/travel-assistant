export const TOOL_PROVIDERS = {
  TRAVEL_API: 'travel-api',
} as const;

export const TOOL_RESPONSE_FORMAT = {
  CONTENT_AND_ARTIFACT: 'content_and_artifact',
} as const;

export const TOOL_TIMEOUT_MS = 15_000;

export const AUTHENTICATION_STATUS_PATTERN = /\b(401|403)\b/;
export const RATE_LIMIT_STATUS_PATTERN = /\b429\b/;
export const SERVER_ERROR_STATUS_PATTERN = /\b5\d\d\b/;
