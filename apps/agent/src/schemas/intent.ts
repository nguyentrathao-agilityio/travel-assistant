import { z } from 'zod';

export const IntentSchema = z.enum([
  'explore',
  'plan',
  'book_flight',
  'book_hotel',
  'cancel_booking',
  'general',
]);

export const IntentClassificationSchema = z.object({
  intent: IntentSchema,
});

export type Intent = z.infer<typeof IntentSchema>;
