import { z } from 'zod';

import { API_URL, ENDPOINTS, ERROR_MESSAGES } from '../constants';

const FLIGHTS_DEFAULT_ADULTS = 1;
import {
  ApiFlightSchema,
  ApiFlightSearchResponseSchema,
  FlightInputSchema,
  FlightSchema,
  FlightSearchResultSchema,
} from '../schemas/flights';

const mapFlight = (flight: z.infer<typeof ApiFlightSchema>): z.infer<typeof FlightSchema> => ({
  id: flight.id,
  airline: flight.airline,
  flightNumber: flight.flight_number,
  origin: flight.origin,
  destination: flight.destination,
  departureTime: flight.departure_time,
  arrivalTime: flight.arrival_time,
  durationMinutes: flight.duration_minutes,
  price: flight.price,
  currency: flight.currency,
  seatsAvailable: flight.seats_available,
  stops: flight.stops,
});

const buildSearchParams = (input: z.infer<typeof FlightInputSchema>): URLSearchParams => {
  const params = new URLSearchParams({
    origin: input.origin,
    destination: input.destination,
    departure_date: input.departure_date,
    adults: String(input.adults ?? FLIGHTS_DEFAULT_ADULTS),
  });

  if (input.return_date) params.set('return_date', input.return_date);
  if (input.airline) params.set('airline', input.airline);
  if (input.max_price != null) params.set('max_price', String(input.max_price));
  if (input.max_stops != null) params.set('max_stops', String(input.max_stops));
  if (input.sort) params.set('sort', input.sort);

  return params;
};

/**
 * Calls the external flights search API and returns validated, camelCase results.
 * Throws on missing config, non-OK response, or invalid response shape.
 */
export const searchFlights = async (
  input: z.infer<typeof FlightInputSchema>
): Promise<z.infer<typeof FlightSearchResultSchema>> => {
  if (!API_URL) throw new Error(ERROR_MESSAGES.NO_API_URL);

  try {
    const res = await fetch(
      `${API_URL}${ENDPOINTS.FLIGHTS}/search?${buildSearchParams(input).toString()}`
    );

    if (!res.ok) throw new Error(ERROR_MESSAGES.SEARCH_FAILED(res.status, res.statusText));

    const raw: unknown = await res.json();
    const parsed = ApiFlightSearchResponseSchema.safeParse(raw);

    if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);

    const { data } = parsed;

    return {
      count: data.count,
      results: data.results.map(mapFlight),
      ...(data.return_count != null && { returnCount: data.return_count }),
      ...(data.return_results != null && { returnResults: data.return_results.map(mapFlight) }),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(ERROR_MESSAGES.UNKNOWN);
  }
};
