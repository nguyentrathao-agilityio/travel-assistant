import { z } from 'zod';

import { HotelAvailabilitySchema } from './hotel';
import { RouteResultSchema } from './route';

// ─── Cost breakdown ────────────────────────────────────────────────────────

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

// ─── Inline flight schema (mirrors agent FlightSchema) ─────────────────────

export const SuggestedFlightSchema = z.object({
  id: z.string(),
  airline: z.object({ code: z.string(), name: z.string() }),
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

// ─── Main result ───────────────────────────────────────────────────────────

export const TripSummaryResultSchema = z.object({
  destination: z.string(),
  country: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  travelers: z.number(),
  days: z.number(),
  /** Best-value flight found — null when skipped or not found */
  suggestedFlight: SuggestedFlightSchema.nullable().optional(),
  /** Best-rated available hotel — null when skipped or not found */
  suggestedHotel: HotelAvailabilitySchema.nullable().optional(),
  route: RouteResultSchema.nullable().optional(),
  costEstimate: TripCostEstimateSchema,
});

// ─── Exported types ────────────────────────────────────────────────────────

export type CostItem = z.infer<typeof CostItemSchema>;
export type TripCostEstimate = z.infer<typeof TripCostEstimateSchema>;
export type SuggestedFlight = z.infer<typeof SuggestedFlightSchema>;
export type TripSummaryResult = z.infer<typeof TripSummaryResultSchema>;
