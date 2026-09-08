export const formatDateFull = (dateStr?: string): string => {
  if (!dateStr) return '';

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateShort = (dateStr: string): string =>
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
