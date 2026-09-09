// Types
import type { HotelAvailability } from '@repo/types';
import { computeHotelBadgeKinds } from '@repo/utils';

export interface HotelBadge {
  label: string;
}

const HOTEL_BADGES = {
  cheapest: { label: '💵 Cheapest' },
  bestRated: { label: '⭐ Best rated' },
  bestValue: { label: '👍 Best value' },
} satisfies Record<string, HotelBadge>;

/** Computes badges for a list of hotels based on price, rating, and value heuristics. */
export const computeHotelBadges = (hotels: HotelAvailability[]): Map<string, HotelBadge> => {
  return new Map([...computeHotelBadgeKinds(hotels)].map(([id, kind]) => [id, HOTEL_BADGES[kind]]));
};
