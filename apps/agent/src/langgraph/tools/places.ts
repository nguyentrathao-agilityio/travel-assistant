import { tool } from '@langchain/core/tools';

import { getPlaces } from '../services/places';
import { PlacesInputSchema } from '../schemas/places';
import { TOOL_ERROR_MESSAGES } from '../constants';

export const placesTool = tool(
  async (input) => {
    try {
      const result = await getPlaces(input);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.PLACES,
      });
    }
  },
  {
    name: 'placesTool',
    description: `Search places of interest in a city — attractions, restaurants, cafes, activities, nightlife, and shopping.
    Required: city.
    Optional: category (attraction|restaurant|cafe|activity|nightlife|shopping), price_level (1=free/cheap … 4=luxury), recommended (true = editor picks only), sort (default: rating_desc), min_rating.
    Default behavior: recommended: true, sort: "rating_desc" for best results.
    Use price_level: 1 for budget, 3-4 for upscale. Use category to filter by user's intent (food → restaurant, sightseeing → attraction, going out → nightlife).
    If the user's request doesn't indicate a category (e.g. "what should I see in X?"), ask the user which category they want before calling — do not guess or call this tool more than once per request.
    Only call when city is available.`,
    schema: PlacesInputSchema,
    returnDirect: true,
  }
);
