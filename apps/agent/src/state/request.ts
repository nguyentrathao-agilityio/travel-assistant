import { z } from 'zod';

// Schemas
import { IntentSchema } from '@/schemas';

export const TravelRequestSchema = z.object({
  intent: IntentSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  travelers: z.number().int().positive().optional(),
  budget: z.number().nonnegative().optional(),
});
export type TravelRequest = z.infer<typeof TravelRequestSchema>;

export const TravelRequestUpdateSchema = TravelRequestSchema.partial();

export const mergeRequest = (
  current: TravelRequest,
  update: Partial<TravelRequest>
): TravelRequest => ({ ...current, ...update });
