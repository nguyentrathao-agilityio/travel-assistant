import type { TripState } from '@repo/types';

const TRIP_STATE_KEYS: (keyof TripState)[] = [
  'flights',
  'flightSelectionStatus',
  'flightBooking',
  'hotel',
  'hotelSelectionStatus',
  'hotelBooking',
  'destination',
  'startDate',
  'endDate',
  'travelers',
  'clientDate',
  'clientTimezone',
];

// Picks the TripState-shaped subset out of a checkpoint that also carries internal graph state.
export const extractTripState = (values: Record<string, unknown> | undefined): TripState => {
  if (!values) return {};

  const result: TripState = {};

  for (const key of TRIP_STATE_KEYS) {
    const value = values[key];

    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
};
