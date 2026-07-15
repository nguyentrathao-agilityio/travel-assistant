/**
 * Formats an ISO date string as a human-readable relative time label.
 */
export const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Formats a date string as "Jun 10".
 */
export const formatDateShort = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/**
 * Formats a date string as "Jun 10, 2026".
 */
export const formatDateFull = (dateStr?: string): string => {
  if (!dateStr) return '';

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats a date string as "Wed, Jun 10".
 */
export const formatDateWeekday = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

/**
 * Formats a check-in/check-out pair as "Jun 10 – Jun 17".
 */
export const formatDateRange = (checkIn: string, checkOut: string): string =>
  `${formatDateShort(checkIn)} - ${formatDateShort(checkOut)}`;

/**
 * Extracts the HH:MM time portion from an ISO datetime string.
 */
export const formatTime = (isoStr: string): string => isoStr.split('T')[1]?.slice(0, 5) ?? isoStr;

/**
 * Formats a price with its currency symbol.
 */
export const formatPrice = (price: number, currency: string): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);

/**
 * Formats a monetary amount with its currency symbol.
 * Returns '—' for zero amounts.
 */
export const formatAmount = (amount: number, currency = 'USD'): string => {
  if (amount === 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats a duration in minutes as a human-readable string.
 * For example, 90 minutes would be formatted as "1h 30m".
 */
export const formatDuration = (minutes: number): string => {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;

  if (!hours) {
    return `${total}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

export const formatDisplayDate = (iso?: string): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/** Adds `dayOffset` days to an ISO date string. Returns null if no date provided. */
export const offsetDate = (startDate: string | undefined, dayOffset: number): string | null => {
  if (!startDate) return null;
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
};
