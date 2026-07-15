import { z } from 'zod';

import { TipsResultSchema, WeatherResultSchema } from '@repo/schemas';

export { DestinationExplorerInputSchema } from '@repo/schemas';

/** Carry-through after step 1 (fetch-weather). */
export const WeatherFetchedSchema = z.object({
  city: z.string(),
  country: z.string().optional(),
  weather: WeatherResultSchema,
});

/** Carry-through after step 2 (fetch-tips). */
export const TipsFetchedSchema = z.object({
  city: z.string(),
  weather: WeatherResultSchema,
  tips: TipsResultSchema,
});
