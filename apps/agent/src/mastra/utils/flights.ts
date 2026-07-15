import { z } from 'zod';

// Constants
import { FLIGHTS_DEFAULT_ADULTS } from '@/constants';

// Schemas
import { ApiFlightSchema, FlightInputSchema, FlightSchema } from '@/schemas';

/**
 * Maps a single flight from the external API (snake_case) to the tool output shape (camelCase).
 */
export const mapFlight = (
  flight: z.infer<typeof ApiFlightSchema>
): z.infer<typeof FlightSchema> => ({
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

/**
 * Builds query params for the flights search API from validated tool input.
 */
export const buildSearchParams = (input: z.infer<typeof FlightInputSchema>): URLSearchParams => {
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
