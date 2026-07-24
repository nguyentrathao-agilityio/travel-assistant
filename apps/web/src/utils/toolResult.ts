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
