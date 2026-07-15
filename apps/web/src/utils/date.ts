/**
 * The function `todayClientIso` returns the current date in the ISO format for the Swedish locale.
 */
export const todayClientIso = (): string => new Date().toLocaleDateString('sv');

/**
 * The function `clientTimezone` returns the timezone of the client using the browser's Intl API.
 */
export const clientTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;
