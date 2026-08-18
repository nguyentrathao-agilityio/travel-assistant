import { z } from 'zod';

// Convert model-generated nulls to undefined for optional Zod fields.
export const stripNulls = (raw: unknown): unknown => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([k, v]) => [
        k,
        v === null ? undefined : v,
      ])
    );
  }

  return raw;
};

/** Validates model-generated tool input while preserving the shared error contract. */
export const parseToolInput = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  input: unknown
): Promise<z.output<Schema>> => {
  const parsed = schema.safeParse(input);

  if (parsed.success) return Promise.resolve(parsed.data);

  const details = parsed.error.issues.map((issue) => issue.message).join('; ');

  return Promise.reject(new Error(`Validation error: ${details}`));
};
