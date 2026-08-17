import type { TourLeg, TravelLeg } from '@repo/types';

import type { RouteTimeSlot } from '@/constants';

/**
 * Adapts a TourLeg (RouteCard API shape) to a TravelLeg (LegConnector shape).
 * Renames the `mode` field to `transport`.
 */
export const toTravelLeg = (leg: TourLeg): TravelLeg => ({
  transport: leg.mode,
  durationMin: leg.durationMin,
  distanceKm: leg.distanceKm,
});

/**
 * Returns a Google Maps URL for the given coordinates, or null if either is undefined.
 */
export const toMapsUrl = (lat?: number, lng?: number): string | null => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return `https://www.google.com/maps?q=${lat},${lng}`;
};

/** Splits an array into chunks of at most `size` elements. */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];

  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));

  return result;
};

/** Assigns each stop within a day to a time-of-day slot by proportional index. */
export const getSlot = (idx: number, total: number): RouteTimeSlot => {
  const slot = Math.floor((idx / Math.max(total, 1)) * 3);

  return (['morning', 'afternoon', 'evening'] as const)[Math.min(slot, 2)];
};
