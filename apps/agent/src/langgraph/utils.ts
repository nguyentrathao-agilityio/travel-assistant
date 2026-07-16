export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isValidIsoDate = (value: string): boolean =>
  ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value));

export const todayIso = (): string => new Date().toISOString().split('T')[0];

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
