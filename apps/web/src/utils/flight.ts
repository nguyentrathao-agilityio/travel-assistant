import type { BadgeVariant } from '@/components';
import type { Flight } from '@repo/types';

const AIRLINE_ICON_CLASSES = [
  'bg-airline-icon-danger text-icon-on-vivid',
  'bg-airline-icon-accent text-icon-on-vivid',
  'bg-airline-icon-primary text-icon-on-vivid',
  'bg-airline-icon-success text-icon-on-vivid',
  'bg-airline-icon-warning text-icon-on-vivid',
] as const;

/** Returns a consistent Tailwind color class for an airline based on its IATA code. */
export const getAirlineIconClass = (code: string): string => {
  const index =
    code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AIRLINE_ICON_CLASSES.length;

  return AIRLINE_ICON_CLASSES[index];
};

export interface FlightBadge {
  label: string;
  variant: BadgeVariant;
}

const FLIGHT_BADGES = {
  cheapest: { label: 'Cheapest', variant: 'success' },
  fastest: { label: 'Fastest', variant: 'warning' },
  popular: { label: 'Most popular', variant: 'primary' },
} satisfies Record<string, FlightBadge>;

// Computes badges for a list of flights based on price, duration, and popularity heuristics
export const computeBadges = (flights: Flight[] = []): Map<string, FlightBadge> => {
  const map = new Map<string, FlightBadge>();

  if (flights.length < 2) {
    return map;
  }

  const cheapest = flights.reduce((min, curr) => (curr.price < min.price ? curr : min));
  const fastest = flights.reduce((min, curr) =>
    curr.durationMinutes < min.durationMinutes ? curr : min
  );

  map.set(cheapest.id, FLIGHT_BADGES.cheapest);
  if (fastest.id !== cheapest.id) {
    map.set(fastest.id, FLIGHT_BADGES.fastest);
  }

  if (flights.length >= 3) {
    // "Most popular" is a positional heuristic — first flight not already tagged
    const untagged = flights.find((flight) => !map.has(flight.id));

    if (untagged) {
      map.set(untagged.id, FLIGHT_BADGES.popular);
    }
  }

  return map;
};
