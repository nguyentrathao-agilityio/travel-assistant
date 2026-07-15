import { createTool } from '@mastra/core/tools';

// Services
import { getPlaces } from '@/services';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_IDS } from '@/constants';

// Utils
import { AppError } from '@/utils';
import {
  makeToolOutput,
  TOOL_ERROR_OUTPUT,
  TOOL_NO_RESULTS_OUTPUT,
  TOOL_READY_OUTPUT,
} from '@/utils';

// Schemas
import { PlacesSearchResultSchema } from '@repo/schemas';
import { PlacesCategorySchema, PlacesInputSchema, ToolErrorSchema } from '@/schemas';

export const placesTool = createTool({
  id: TOOL_IDS.PLACES,
  description: `Search places of interest in a city — attractions, restaurants, cafes, activities, nightlife, and shopping.
    Required: city.
    Optional: category (attraction|restaurant|cafe|activity|nightlife|shopping), price_level (1=free/cheap … 4=luxury), recommended (true = editor picks only), sort (default: rating_desc), min_rating.
    Default behavior: recommended: true, sort: "rating_desc" for best results.
    Use price_level: 1 for budget, 3-4 for upscale. Use category to filter by user's intent (food → restaurant, sightseeing → attraction, going out → nightlife).
    If the user's request doesn't indicate a category (e.g. "what should I see in X?"), ask the user which category they want before calling — do not guess or call this tool more than once per request.
    Only call when city is available.`,
  inputSchema: PlacesInputSchema,
  outputSchema: PlacesSearchResultSchema.or(ToolErrorSchema),
  execute: async (inputData) => {
    try {
      return await getPlaces(inputData);
    } catch (error) {
      return {
        error: error instanceof AppError ? error.message : TOOL_ERROR_MESSAGES.PLACES,
      };
    }
  },
  toModelOutput: (output) => {
    if ('error' in output) return TOOL_ERROR_OUTPUT;
    if (output.results.length === 0) {
      const city = output.city ?? 'this city';
      const cat = output.category ? ` for "${output.category}"` : '';
      const otherCategories = PlacesCategorySchema.options
        .filter((c) => c !== output.category)
        .join(', ');
      return makeToolOutput(
        `No results found${cat} in ${city}. ` +
          `Tell the user, then suggest: try a different category (${otherCategories}), or remove the category filter.`
      );
    }
    return TOOL_READY_OUTPUT;
  },
});
