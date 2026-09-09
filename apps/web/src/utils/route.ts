import type { RouteTimeSlot } from '@/constants';

export const toMapsUrl = (lat?: number, lng?: number): string | null => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return `https://www.google.com/maps?q=${lat},${lng}`;
};

export const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];

  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));

  return result;
};

export const getSlot = (idx: number, total: number): RouteTimeSlot => {
  const slot = Math.floor((idx / Math.max(total, 1)) * 3);

  return (['morning', 'afternoon', 'evening'] as const)[Math.min(slot, 2)];
};
