import type { z } from 'zod';

export const parseToolResult = (result: unknown): unknown => {
  if (typeof result !== 'string') return result;

  const trimmedResult = result.trim();
  if (!trimmedResult.startsWith('{') && !trimmedResult.startsWith('[')) return result;

  try {
    return JSON.parse(trimmedResult);
  } catch {
    return result;
  }
};

export const safeParseToolResult = <Output>(
  schema: z.ZodType<Output>,
  result: unknown
): z.SafeParseReturnType<Output, Output> => schema.safeParse(parseToolResult(result));

export type ToolErrorResult = { error: string; code?: string; retryable?: boolean };

export const getToolError = (result: unknown): ToolErrorResult | undefined => {
  const parsed = parseToolResult(result);
  if (typeof parsed !== 'object' || parsed === null || !('error' in parsed)) return undefined;
  const error = (parsed as { error?: unknown }).error;
  if (typeof error !== 'string') return undefined;
  const retryable = (parsed as { retryable?: unknown }).retryable;
  const code = (parsed as { code?: unknown }).code;
  return {
    error,
    ...(typeof code === 'string' && { code }),
    ...(typeof retryable === 'boolean' && { retryable }),
  };
};
