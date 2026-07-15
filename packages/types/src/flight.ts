export interface Airline {
  code: string;
  name: string;
}

export interface Flight {
  id: string;
  airline: Airline;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
  currency: string;
  seatsAvailable: number;
  stops: number;
}

export interface FlightSearchResult {
  count: number;
  results: Flight[];
  returnCount?: number;
  returnResults?: Flight[];
}
