import { z } from 'zod';

import { isValidIsoDate, todayIso } from '../utils/date';
import { stripNulls } from '../utils/schema';

export const FlightSortSchema = z.enum([
  'departure_asc',
  'departure_desc',
  'price_asc',
  'price_desc',
  'duration_asc',
  'duration_desc',
]);

export const FlightInputSchema = z.preprocess(
  stripNulls,
  z
    .object({
      origin: z
        .string()
        .trim()
        .regex(/^[A-Za-z]{3}$/, 'Must be a 3-letter IATA code')
        .transform((v) => v.toUpperCase())
        .describe('IATA 3-letter departure airport code, e.g. DAD'),
      destination: z
        .string()
        .trim()
        .regex(/^[A-Za-z]{3}$/, 'Must be a 3-letter IATA code')
        .transform((v) => v.toUpperCase())
        .describe('IATA 3-letter arrival airport code, e.g. SGN'),
      departure_date: z
        .string()
        .refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date')
        .describe('Departure date in YYYY-MM-DD format'),
      adults: z.number().min(1).optional().describe('Number of adult passengers (default 1)'),
      return_date: z
        .string()
        .refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date')
        .optional()
        .describe('Return date in YYYY-MM-DD — enables round-trip'),
      airline: z.string().optional().describe('Filter by IATA airline code, e.g. VN'),
      max_price: z.number().optional().describe('Maximum price per adult in USD'),
      max_stops: z
        .number()
        .min(0)
        .optional()
        .describe('Maximum number of stops (0 = nonstop only)'),
      sort: FlightSortSchema.optional().describe('Sort order for results'),
    })
    .superRefine((data, ctx) => {
      const today = todayIso();
      if (data.departure_date < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `departure_date must not be in the past. Today is ${today} — use today or a future date.`,
          path: ['departure_date'],
        });
      }
      if (data.return_date && data.return_date < data.departure_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'return_date must be on or after departure_date',
          path: ['return_date'],
        });
      }
    })
);

// API response — snake_case as returned by the external service
const ApiAirlineSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export const ApiFlightSchema = z.object({
  id: z.string(),
  airline: ApiAirlineSchema,
  flight_number: z.string(),
  origin: z.string(),
  destination: z.string(),
  departure_time: z.string(),
  arrival_time: z.string(),
  duration_minutes: z.number(),
  price: z.number(),
  currency: z.string(),
  seats_available: z.number(),
  stops: z.number(),
});

export const ApiFlightSearchResponseSchema = z.object({
  count: z.number(),
  results: z.array(ApiFlightSchema),
  return_count: z.number().nullish(),
  return_results: z.array(ApiFlightSchema).nullish(),
});

// Tool output — camelCase to match shared Flight types
const AirlineSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export const FlightSchema = z.object({
  id: z.string(),
  airline: AirlineSchema,
  flightNumber: z.string(),
  origin: z.string(),
  destination: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  durationMinutes: z.number(),
  price: z.number(),
  currency: z.string(),
  seatsAvailable: z.number(),
  stops: z.number(),
});

export const FlightSearchResultSchema = z.object({
  count: z.number(),
  results: z.array(FlightSchema),
  returnCount: z.number().optional(),
  returnResults: z.array(FlightSchema).optional(),
});

export type FlightInput = z.infer<typeof FlightInputSchema>;
export type ApiFlightSearchResponse = z.infer<typeof ApiFlightSearchResponseSchema>;
export type Flight = z.infer<typeof FlightSchema>;
export type FlightSearchResult = z.infer<typeof FlightSearchResultSchema>;
