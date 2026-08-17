import { z } from 'zod';

export const TOOL_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INVALID_PROVIDER_RESPONSE: 'INVALID_PROVIDER_RESPONSE',
  UNKNOWN_PROVIDER_ERROR: 'UNKNOWN_PROVIDER_ERROR',
} as const;

export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[keyof typeof TOOL_ERROR_CODES];

const TOOL_ERROR_CODE_VALUES = [
  TOOL_ERROR_CODES.VALIDATION_ERROR,
  TOOL_ERROR_CODES.TIMEOUT,
  TOOL_ERROR_CODES.RATE_LIMITED,
  TOOL_ERROR_CODES.PROVIDER_UNAVAILABLE,
  TOOL_ERROR_CODES.AUTHENTICATION_FAILED,
  TOOL_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
  TOOL_ERROR_CODES.UNKNOWN_PROVIDER_ERROR,
] as const satisfies readonly ToolErrorCode[];

export const ToolErrorCodeSchema = z.enum(TOOL_ERROR_CODE_VALUES);

export const ToolErrorSchema = z.object({
  // Retained for existing graph and UI consumers.
  error: z.string(),
  code: ToolErrorCodeSchema,
  message: z.string(),
  retryable: z.boolean(),
  provider: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ToolError = z.infer<typeof ToolErrorSchema>;
