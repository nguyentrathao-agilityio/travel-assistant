export const todayClientIso = (): string => new Date().toLocaleDateString('sv');

export const clientTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;
