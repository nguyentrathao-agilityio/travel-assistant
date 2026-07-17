import { z } from 'zod';

import { getWeather } from './weather';
import { getLocalTips } from './tips';
import { getPlaces } from './places';
import {
  DestinationExplorerInputSchema,
  DestinationExplorerResultSchema,
} from '../schemas/destination-explorer';

type DestinationExplorerToolOutput = z.infer<typeof DestinationExplorerResultSchema>;

/**
 * Builds a unified destination overview — weather, local tips, and top places —
 * chained sequentially since tips resolves its country from the weather lookup.
 */
export const getDestinationExplorer = async (
  input: z.infer<typeof DestinationExplorerInputSchema>
): Promise<DestinationExplorerToolOutput> => {
  const { city, country, forecastDays } = input;

  const weather = await getWeather({ city, days: forecastDays });

  // Weather API always resolves the country — use it as fallback
  const resolvedCountry = country ?? weather.location.country;

  const tips = await getLocalTips({ city, country: resolvedCountry });

  const places = await getPlaces({ city, recommended: true, sort: 'rating_desc', limit: 3 });

  const parsed = DestinationExplorerResultSchema.safeParse({ city, places, tips, weather });
  if (!parsed.success) {
    throw new Error(`Failed to build destination explorer result: ${parsed.error.message}`);
  }

  return parsed.data;
};
