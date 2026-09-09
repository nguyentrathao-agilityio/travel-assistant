// Types
import type { Flight } from '@repo/types';
import { computeFlightBadgeKinds } from '@repo/utils';

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
  return new Map(
    [...computeFlightBadgeKinds(flights)].map(([id, kind]) => [id, FLIGHT_BADGES[kind]])
  );
};
