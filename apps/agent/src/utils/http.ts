import type { z } from 'zod';

/** Fetches a URL and validates the JSON body, throwing on network failure, non-OK status, or shape mismatch. */
export const fetchAndValidate = async <T>(
  url: string,
  // Input pinned to `any` so schemas with `.default()` infer T from their output type, not input.
  schema: z.ZodType<T, z.ZodTypeDef, any>
): Promise<T> => {
  let res: Response;

  try {
    res = await fetch(url);
  } catch (cause) {
    throw new Error(`Network request failed: ${url}`, { cause });
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status} ${res.statusText}: ${url}`);
  }

  const raw = await res.json();
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid response from ${url}: ${parsed.error.message}`);
  }

  return parsed.data;
};
