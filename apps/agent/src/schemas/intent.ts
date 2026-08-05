import { z } from 'zod';

import { isValidIsoDate } from '../utils/date';

export const IntentSchema = z.enum([
  'explore',
  'plan',
  'book_flight',
  'book_hotel',
  'cancel_booking',
  'general',
]);

export const PlanningOperationSchema = z.enum([
  'weather',
  'flights',
  'hotels',
  'places',
  'route',
  'tripSummary',
  'knowledge',
]);

export const IntentClassificationSchema = z.object({
  intent: IntentSchema,
  confidence: z.number().min(0).max(1),
  requiredOperations: z.array(PlanningOperationSchema),
  // OpenAI Structured Outputs requires every object property to be required. A null value means
  // that the latest user message did not supply or change that field.
  extractedFields: z.object({
    origin: z.string().trim().min(1).nullable(),
    destination: z.string().trim().min(1).nullable(),
    departureDate: z.string().refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date').nullable(),
    returnDate: z.string().refine(isValidIsoDate, 'Must be a valid YYYY-MM-DD date').nullable(),
    travelers: z.number().int().positive().nullable(),
    budget: z.number().nonnegative().nullable(),
  }),
});

export type Intent = z.infer<typeof IntentSchema>;
export type PlanningOperation = z.infer<typeof PlanningOperationSchema>;
export type IntentClassification = z.infer<typeof IntentClassificationSchema>;
