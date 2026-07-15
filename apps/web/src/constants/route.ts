import { Sunrise, Sun, Moon } from 'lucide-react';

export const ROUTE_MAX_STOPS_OPTIONS = [2, 3, 4, 5, 6, 7, 8].map((n) => ({
  value: String(n),
  label: String(n),
}));

export const ROUTE_DEFAULT_MAX_STOPS = 5;

export const ROUTE_LOADING_SKELETON_COUNT = 5;

export const ROUTE_TIME_SLOTS = [
  { key: 'morning', label: 'Morning', Icon: Sunrise },
  { key: 'afternoon', label: 'Afternoon', Icon: Sun },
  { key: 'evening', label: 'Evening', Icon: Moon },
] as const;

export type RouteTimeSlot = (typeof ROUTE_TIME_SLOTS)[number]['key'];
