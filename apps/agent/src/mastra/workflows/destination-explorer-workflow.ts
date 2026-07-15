import { createWorkflow, createStep } from '@mastra/core/workflows';

// Services
import { getPlaces, getLocalTips, getWeather } from '@/services';

// Schemas
import { DestinationExplorerResultSchema } from '@repo/schemas';
import { DestinationExplorerInputSchema, WeatherFetchedSchema, TipsFetchedSchema } from '@/schemas';

// Step 1 — Fetch weather
const fetchWeatherStep = createStep({
  id: 'fetch-weather',
  description: 'Fetch weather forecast for the destination city',
  inputSchema: DestinationExplorerInputSchema,
  outputSchema: WeatherFetchedSchema,
  execute: async ({ inputData }) => {
    const { city, country } = inputData;

    const weather = await getWeather({ city });

    return { city, country, weather };
  },
});

//Step 2 — Fetch tips (uses weather output)
const fetchTipsStep = createStep({
  id: 'fetch-tips',
  description: 'Fetch local tips, inferring country from weather location',
  inputSchema: WeatherFetchedSchema,
  outputSchema: TipsFetchedSchema,
  execute: async ({ inputData }) => {
    const { city, country, weather } = inputData;

    // Weather API always resolves the country — use it as fallback
    const resolvedCountry = country ?? weather.location.country;

    const tips = await getLocalTips({ city, country: resolvedCountry });

    return { city, weather, tips };
  },
});

// Step 3 — Fetch places (uses weather + tips output)
const fetchPlacesStep = createStep({
  id: 'fetch-places',
  description: 'Fetch top recommended places for the destination city',
  inputSchema: TipsFetchedSchema,
  outputSchema: DestinationExplorerResultSchema,
  execute: async ({ inputData }) => {
    const { city, weather, tips } = inputData;

    const places = await getPlaces({ city, recommended: true, sort: 'rating_desc', limit: 3 });

    const parsed = DestinationExplorerResultSchema.safeParse({ city, places, tips, weather });
    if (!parsed.success) {
      throw new Error(`Failed to build destination explorer result: ${parsed.error.message}`);
    }

    return parsed.data;
  },
});

// Workflow
// Agent calls destinationExplorerTool → this workflow runs 3 sequential steps:
//   Step 1 — fetch-weather : forecast; country resolved from weather.location.country
//   Step 2 — fetch-tips    : local tips using country resolved in step 1
//   Step 3 — fetch-places  : top 3 recommended places
// Result rendered by useDestinationExplorerAction → DestinationExplorerCard
export const destinationExplorerWorkflow = createWorkflow({
  id: 'destination-explorer-workflow',
  description:
    'Destination explorer — weather, local tips, and top places chained in one sequential workflow',
  inputSchema: DestinationExplorerInputSchema,
  outputSchema: DestinationExplorerResultSchema,
  steps: [fetchWeatherStep, fetchTipsStep, fetchPlacesStep],
})
  .then(fetchWeatherStep)
  .then(fetchTipsStep)
  .then(fetchPlacesStep)
  .commit();
