import { z } from 'zod';

// Schemas
import { DestinationExplorerInputSchema, DestinationExplorerResultSchema } from '@/schemas';

// Services
import { getWeather } from './weather';
import { getLocalTips } from './tips';
import { getPlaces } from './places';

type DestinationExplorerToolOutput = z.infer<typeof DestinationExplorerResultSchema>;

/** Builds a destination overview, using weather to resolve the country for local tips. */
export const getDestinationExplorer = async (
  input: z.infer<typeof DestinationExplorerInputSchema>
): Promise<DestinationExplorerToolOutput> => {
  const { city, country, forecastDays } = input;

  const weather = await getWeather({ city, days: forecastDays });

  // Use the weather result as the country fallback.
  const resolvedCountry = country ?? weather.location.country;

  const tips = await getLocalTips({ city, country: resolvedCountry });

  const places = await getPlaces({ city, recommended: true, sort: 'rating_desc', limit: 3 });

  const parsed = DestinationExplorerResultSchema.safeParse({ city, places, tips, weather });

  if (!parsed.success) {
    throw new Error(`Failed to build destination explorer result: ${parsed.error.message}`);
  }

  return parsed.data;
};
