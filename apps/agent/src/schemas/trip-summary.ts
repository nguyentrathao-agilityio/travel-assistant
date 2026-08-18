import { z } from 'zod';

// Schemas
import { FlightSchema } from './flights';
import { HotelAvailabilitySchema } from './hotel';
import { RouteResultSchema } from './route';

// Utils
import { isValidIsoDate } from '@/utils/date';

const TripSummaryInputShape = z.object({
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
  travelers: z.number().int().optional().describe('Number of travelers (min 1)'),
  flightOrigin: z.string().optional().describe('IATA departure airport code, e.g. HAN'),
  skipFlights: z
    .boolean()
    .optional()
    .describe('Skip flight search — user already has booked flights'),
  skipHotel: z.boolean().optional().describe('Skip hotel search — user already has booked a hotel'),
});

/** Business-rule checks applied on top of {@link TripSummaryInputShape}. */
const refineTripSummaryInput = (
  data: z.infer<typeof TripSummaryInputShape>,
  ctx: z.RefinementCtx
) => {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endDate must be on or after startDate',
      path: ['endDate'],
    });
  }

  if (data.travelers !== undefined && data.travelers < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'travelers must be at least 1',
      path: ['travelers'],
    });
  }
};

/** Structural schema for the `tool()` config — safe for LangChain's pre-handler validation. */
export const TripSummaryToolSchema = TripSummaryInputShape;

/** Full schema, including business rules — re-validated inside the tool handler. */
export const TripSummaryInputSchema = TripSummaryInputShape.superRefine(refineTripSummaryInput);

export type TripSummaryInput = z.infer<typeof TripSummaryInputSchema>;

export const DailyRatesSchema = z.object({
  food: z.number(),
  activities: z.number(),
  transport: z.number(),
});

export type DailyRates = z.infer<typeof DailyRatesSchema>;

const CostItemSchema = z.object({
  label: z.string(),
  amount: z.number(),
  currency: z.string(),
  note: z.string().optional(),
});

export const TripCostEstimateSchema = z.object({
  flightTotal: z.number(),
  hotelTotal: z.number(),
  foodTotal: z.number(),
  activitiesTotal: z.number(),
  localTransportTotal: z.number(),
  grandTotal: z.number(),
  currency: z.string(),
  days: z.number(),
  travelers: z.number(),
  breakdown: z.array(CostItemSchema),
});

export const TripSummaryResultSchema = z.object({
  destination: z.string(),
  country: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  travelers: z.number(),
  days: z.number(),
  /** Best-value flight found — null when skipped or not found */
  suggestedFlight: FlightSchema.nullable().optional(),
  /** Best-rated available hotel — null when skipped or not found */
  suggestedHotel: HotelAvailabilitySchema.nullable().optional(),
  route: RouteResultSchema.nullable().optional(),
  costEstimate: TripCostEstimateSchema,
});

export type CostItem = z.infer<typeof CostItemSchema>;
export type TripCostEstimate = z.infer<typeof TripCostEstimateSchema>;
export type TripSummaryResult = z.infer<typeof TripSummaryResultSchema>;
