import { tool } from '@langchain/core/tools';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES, TOOL_PROVIDERS, TOOL_RESPONSE_FORMAT } from '@/constants';

// Schemas
import { PlacesInputSchema } from '@/schemas';

// Services
import { getPlaces } from '@/services/places';

// Utils
import { executeReadTool } from '@/utils/tool-contract';

export const placesTool = tool(
  async (input) =>
    executeReadTool(getPlaces(input), TOOL_PROVIDERS.TRAVEL_API, TOOL_ERROR_MESSAGES.PLACES),
  {
    name: TOOL_NAMES.PLACES,
    description: `Search places of interest in a city — attractions, restaurants, cafes, activities, nightlife, and shopping.
    Required: city.
    Optional:
      - category (attraction | restaurant | cafe | activity | nightlife | shopping)
      - price_level (1 = free/cheap … 4 = luxury)
      - recommended (true = editor picks only)
      - sort (default: rating_desc)
      - min_rating

    Rules:
      - Default behavior: recommended: true, sort: "rating_desc" for best results.
      - Use price_level: 1 for budget, 3-4 for upscale.
      - Use category to filter by user's intent (food/dishes/restaurants → restaurant, attractions/sights/sightseeing/landmarks/things to see or do/what to visit → attraction, cafes/coffee → cafe, going out/nightlife/bars → nightlife, shopping/markets → shopping). These keyword matches are enough — call immediately, do not ask for confirmation.
      - Only ask which category the user wants when the request truly gives no signal at all (e.g. bare "what's good in X?" or "any recommendations for X?" with no other cues) — this should be rare, not the default.
      - Do not call this tool more than once per request.
      - Only call when city is available.`,
    schema: PlacesInputSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
