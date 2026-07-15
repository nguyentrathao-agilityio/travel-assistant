type HotelParam = {
  name: string;
  type: 'string' | 'number';
  description: string;
  required: boolean;
};

export const HOTEL_STAR_MAX = 5;
export const HOTEL_AMENITIES_MAX_DISPLAY = 5;

/** Canonical CopilotKit parameter list shared by collect-hotel-info and search-hotels. */
export const HOTEL_BASE_PARAMS: HotelParam[] = [
  { name: 'city', type: 'string', description: 'City name for hotel search', required: false },
  {
    name: 'check_in',
    type: 'string',
    description: 'Check-in date in YYYY-MM-DD format',
    required: false,
  },
  {
    name: 'check_out',
    type: 'string',
    description: 'Check-out date in YYYY-MM-DD format',
    required: false,
  },
  { name: 'guests', type: 'number', description: 'Number of guests', required: false },
  { name: 'min_rating', type: 'number', description: 'Minimum star rating', required: false },
  { name: 'max_price', type: 'number', description: 'Max price per night in USD', required: false },
  { name: 'sort', type: 'string', description: 'Sort order for results', required: false },
];

export const HOTEL_REQUIRED_FIELDS = [
  { key: 'city', label: 'City', placeholder: 'e.g. Paris, Tokyo', type: 'text' },
  { key: 'check_in', label: 'Check-in date', placeholder: 'YYYY-MM-DD', type: 'date' },
  { key: 'check_out', label: 'Check-out date', placeholder: 'YYYY-MM-DD', type: 'date' },
] as const;

export const HOTEL_OPTIONAL_FIELDS = [
  { key: 'guests', label: 'Guests', placeholder: '1', type: 'number' },
  { key: 'min_rating', label: 'Min rating', placeholder: '3', type: 'number' },
  { key: 'max_price', label: 'Max price/night', placeholder: '500', type: 'number' },
] as const;
