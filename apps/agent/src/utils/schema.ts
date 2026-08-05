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
