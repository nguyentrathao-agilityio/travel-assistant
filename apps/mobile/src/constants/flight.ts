export const FLIGHT_LOW_SEATS_THRESHOLD = 9;

export const FLIGHT_TAB = {
  DEPARTURE: 'departure',
  RETURN: 'return',
} as const;

export type FlightTab = (typeof FLIGHT_TAB)[keyof typeof FLIGHT_TAB];
