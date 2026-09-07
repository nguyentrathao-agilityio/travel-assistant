import type { TourLeg, TravelLeg } from '@repo/types';

export const formatDuration = (minutes: number): string => {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;

  if (!hours) return `${total}m`;
  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}m`;
};

export const toTravelLeg = (leg: TourLeg): TravelLeg => ({
  transport: leg.mode,
  durationMin: leg.durationMin,
  distanceKm: leg.distanceKm,
});

export const toMapsUrl = (lat?: number, lng?: number): string | null => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};
