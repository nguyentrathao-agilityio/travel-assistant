// The model sometimes sends explicit `null` for an omitted optional field, but Zod's
// `.optional()` only accepts `undefined` — used as a `z.preprocess` step so those fields
// validate instead of failing parse.
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
