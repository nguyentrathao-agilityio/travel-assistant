export type FlightToolArgs = {
  origin: string;
  destination: string;
  departureDate: string;
};

export type FlightArgs = {
  origin?: string;
  destination?: string;
  departure_date?: string;
  adults?: number | string;
  return_date?: string;
  airline?: string;
  max_price?: number | string;
  max_stops?: number | string;
  sort?: string;
};

export type HotelArgs = {
  city?: string;
  check_in?: string;
  check_out?: string;
  guests?: number | string;
  min_rating?: number | string;
  max_price?: number | string;
  sort?: string;
};
