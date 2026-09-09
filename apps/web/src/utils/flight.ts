import type { BadgeVariant } from '@/components';
import type { Flight } from '@repo/types';
import { computeFlightBadgeKinds } from '@repo/utils';

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
  return new Map(
    [...computeFlightBadgeKinds(flights)].map(([id, kind]) => [id, FLIGHT_BADGES[kind]])
  );
};
