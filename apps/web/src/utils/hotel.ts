import type { BadgeVariant } from '@/components';
import type { HotelAvailability } from '@repo/types';
import { computeHotelBadgeKinds } from '@repo/utils';

export interface HotelBadge {
  label: string;
  variant: BadgeVariant;
}

const HOTEL_BADGES = {
  cheapest: { label: 'Cheapest', variant: 'success' },
  bestRated: { label: 'Best rated', variant: 'primary' },
  bestValue: { label: 'Best value', variant: 'accent' },
} satisfies Record<string, HotelBadge>;

// Computes badges for a list of hotels based on price, rating, and value heuristics
export const computeHotelBadges = (hotels: HotelAvailability[]): Map<string, HotelBadge> => {
  return new Map([...computeHotelBadgeKinds(hotels)].map(([id, kind]) => [id, HOTEL_BADGES[kind]]));
};
