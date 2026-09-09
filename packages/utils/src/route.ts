import type { TourLeg, TravelLeg } from '@repo/types';

export const toTravelLeg = (leg: TourLeg): TravelLeg => ({
  transport: leg.mode,
  durationMin: leg.durationMin,
  distanceKm: leg.distanceKm,
});
