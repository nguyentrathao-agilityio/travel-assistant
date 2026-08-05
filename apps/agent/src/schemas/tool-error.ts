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
