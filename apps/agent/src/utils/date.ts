export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Checks that a string is both YYYY-MM-DD shaped and a real, parseable date. */
export const isValidIsoDate = (value: string): boolean =>
  ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value));

/** Returns today's date as YYYY-MM-DD in UTC. */
export const todayIso = (): string => new Date().toISOString().split('T')[0];

/** Returns the whole-day span between two ISO dates, rounded up. */
export const daysBetween = (start: string, end: string): number =>
  Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
