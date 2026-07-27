export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isValidIsoDate = (value: string): boolean =>
  ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value));

export const todayIso = (): string => new Date().toISOString().split('T')[0];

export const daysBetween = (start: string, end: string): number =>
  Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
