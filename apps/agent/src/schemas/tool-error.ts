import { z } from 'zod';

export const ToolErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'TIMEOUT',
  'RATE_LIMITED',
  'PROVIDER_UNAVAILABLE',
  'AUTHENTICATION_FAILED',
  'INVALID_PROVIDER_RESPONSE',
  'UNKNOWN_PROVIDER_ERROR',
]);

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

export const TOOL_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INVALID_PROVIDER_RESPONSE: 'INVALID_PROVIDER_RESPONSE',
  UNKNOWN_PROVIDER_ERROR: 'UNKNOWN_PROVIDER_ERROR',
} as const satisfies Record<string, ToolError['code']>;
