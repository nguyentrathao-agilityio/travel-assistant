// Types
import type { Flight } from '@repo/types';

export interface FlightBadge {
  label: string;
}

const FLIGHT_BADGES = {
  cheapest: { label: '💵 Cheapest' },
  fastest: { label: '⚡ Fastest' },
  popular: { label: '⭐ Most popular' },
} satisfies Record<string, FlightBadge>;

/** Computes badges for a list of flights based on price, duration, and popularity heuristics. */
export const computeBadges = (flights: Flight[] = []): Map<string, FlightBadge> => {
  const map = new Map<string, FlightBadge>();

  if (flights.length < 2) return map;

  const cheapest = flights.reduce((min, curr) => (curr.price < min.price ? curr : min));
  const fastest = flights.reduce((min, curr) =>
    curr.durationMinutes < min.durationMinutes ? curr : min
  );

  map.set(cheapest.id, FLIGHT_BADGES.cheapest);
  if (fastest.id !== cheapest.id) {
    map.set(fastest.id, FLIGHT_BADGES.fastest);
  }

  if (flights.length >= 3) {
    const untagged = flights.find((flight) => !map.has(flight.id));

    if (untagged) map.set(untagged.id, FLIGHT_BADGES.popular);
  }

  return map;
};
