import { z } from 'zod';

import { PlacesSearchResultSchema } from './places';
import { TipsResultSchema } from './tips';
import { WeatherResultSchema } from './weather';

export const DestinationExplorerInputSchema = z.object({
  city: z.string().describe('Destination city in ASCII English, e.g. "Da Nang" or "Tokyo"'),
  country: z
    .string()
    .optional()
    .describe('Country name — inferred from weather location if omitted'),
  forecastDays: z
    .number()
    .int()
    .min(1)
    .max(16)
    .optional()
    .describe('Number of forecast days (1-16), defaults to 5'),
});

export const DestinationExplorerResultSchema = z.object({
  city: z.string(),
  places: PlacesSearchResultSchema.nullable(),
  tips: TipsResultSchema.nullable(),
  weather: WeatherResultSchema.nullable(),
});

export type DestinationExplorerInput = z.infer<typeof DestinationExplorerInputSchema>;
export type DestinationExplorerResult = z.infer<typeof DestinationExplorerResultSchema>;
