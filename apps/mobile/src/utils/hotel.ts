// Types
import type { HotelAvailability } from '@repo/types';

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
  const map = new Map<string, HotelBadge>();

  if (hotels.length < 2) return map;

  const cheapest = hotels.reduce((min, curr) =>
    curr.pricePerNight < min.pricePerNight ? curr : min
  );
  const bestRated = hotels.reduce((best, curr) => (curr.rating > best.rating ? curr : best));

  map.set(cheapest.id, HOTEL_BADGES.cheapest);
  if (bestRated.id !== cheapest.id) {
    map.set(bestRated.id, HOTEL_BADGES.bestRated);
  }

  if (hotels.length >= 3) {
    const untagged = hotels.find((hotel) => !map.has(hotel.id));

    if (untagged) map.set(untagged.id, HOTEL_BADGES.bestValue);
  }

  return map;
};
