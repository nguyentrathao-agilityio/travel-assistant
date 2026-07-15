type FlightParam = {
  name: string;
  type: 'string' | 'number';
  description: string;
  required: boolean;
};

export const FLIGHT_LOW_SEATS_THRESHOLD = 9;

export const FLIGHT_TAB = {
  DEPARTURE: 'departure',
  RETURN: 'return',
} as const;

export type FlightTab = (typeof FLIGHT_TAB)[keyof typeof FLIGHT_TAB];

/** Canonical CopilotKit parameter list shared by collect-flight-info and search-flights. */
export const FLIGHT_BASE_PARAMS: FlightParam[] = [
  { name: 'origin', type: 'string', description: 'IATA departure airport code', required: false },
  {
    name: 'destination',
    type: 'string',
    description: 'IATA arrival airport code',
    required: false,
  },
  {
    name: 'departure_date',
    type: 'string',
    description: 'Departure date in YYYY-MM-DD format',
    required: false,
  },
  { name: 'adults', type: 'number', description: 'Number of adult passengers', required: false },
  {
    name: 'return_date',
    type: 'string',
    description: 'Return date — enables round-trip',
    required: false,
  },
  { name: 'airline', type: 'string', description: 'Filter by IATA airline code', required: false },
  { name: 'max_price', type: 'number', description: 'Max price per adult in USD', required: false },
  { name: 'max_stops', type: 'number', description: 'Max number of stops', required: false },
  { name: 'sort', type: 'string', description: 'Sort order for results', required: false },
];

export const FLIGHT_REQUIRED_FIELDS = [
  { key: 'destination', label: 'Destination', placeholder: 'e.g. SGN, HAN', type: 'text' },
  { key: 'departure_date', label: 'Departure date', placeholder: 'YYYY-MM-DD', type: 'date' },
] as const;

export const FLIGHT_OPTIONAL_FIELDS = [
  { key: 'origin', label: 'Origin', placeholder: 'e.g. HAN, SGN', type: 'text' },
  { key: 'adults', label: 'Passengers', placeholder: '1', type: 'number' },
  { key: 'return_date', label: 'Return date', placeholder: 'YYYY-MM-DD', type: 'date' },
] as const;
