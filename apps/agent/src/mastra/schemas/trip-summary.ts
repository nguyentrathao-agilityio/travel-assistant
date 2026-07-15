import { z } from 'zod';
import { isValidIsoDate } from '@/utils';

// Schemas
import { HotelSearchResultSchema, RouteResultSchema } from '@repo/schemas';
import { FlightSearchResultSchema } from './flights';

export const TripSummaryInputSchema = z
  .object({
    destination: z.string().describe('Destination city, e.g. "Da Nang"'),
    startDate: z
      .string()
      .refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date')
      .optional()
      .describe('Trip start date YYYY-MM-DD'),
    endDate: z
      .string()
      .refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date')
      .optional()
      .describe('Trip end date YYYY-MM-DD'),
    travelers: z.number().int().min(1).optional().describe('Number of travelers'),
    flightOrigin: z.string().optional().describe('IATA departure airport code, e.g. HAN'),
    skipFlights: z
      .boolean()
      .optional()
      .describe('Skip flight search — user already has booked flights'),
    skipHotel: z
      .boolean()
      .optional()
      .describe('Skip hotel search — user already has booked a hotel'),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate must be on or after startDate',
        path: ['endDate'],
      });
    }
  });

export type TripSummaryInput = z.infer<typeof TripSummaryInputSchema>;

export const ValidatedInputSchema = z.object({
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  travelers: z.number(),
  days: z.number(),
  flightOrigin: z.string().optional(),
  skipFlights: z.boolean(),
  skipHotel: z.boolean(),
});

export const FetchedDataSchema = z.object({
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  travelers: z.number(),
  days: z.number(),
  flightResult: FlightSearchResultSchema.nullable(),
  hotelResult: HotelSearchResultSchema.nullable(),
  routeResult: RouteResultSchema.nullable(),
});
