export const formatDateFull = (dateStr?: string): string => {
  if (!dateStr) return '';

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateShort = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const formatDateRange = (checkIn: string, checkOut: string): string =>
  `${formatDateShort(checkIn)} - ${formatDateShort(checkOut)}`;

export const formatTime = (isoStr: string): string => isoStr.split('T')[1]?.slice(0, 5) ?? isoStr;

export const formatPrice = (price: number, currency: string): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);

export const formatAmount = (amount: number, currency = 'USD'): string => {
  if (amount === 0) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDuration = (minutes: number): string => {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;

  if (!hours) return `${total}m`;
  if (remainingMinutes === 0) return `${hours}h`;

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

export const offsetDate = (startDate: string | undefined, dayOffset: number): string | null => {
  if (!startDate) return null;
  const date = new Date(startDate);

  date.setDate(date.getDate() + dayOffset);

  return date.toISOString().split('T')[0];
};
