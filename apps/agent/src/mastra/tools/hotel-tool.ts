import { createTool } from '@mastra/core/tools';

// Services
import { searchHotels } from '@/services';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_IDS } from '@/constants';

// Schemas
import { HotelSearchResultSchema } from '@repo/schemas';
import { HotelInputSchema, HotelInput, ToolErrorSchema } from '@/schemas';

// Utils
import { AppError } from '@/utils';
import { TOOL_ERROR_OUTPUT, TOOL_NO_RESULTS_OUTPUT, TOOL_READY_OUTPUT } from '@/utils';

export const hotelTool = createTool({
  id: TOOL_IDS.HOTEL,
  description: `Search available hotels for a destination with flexible filters.
    Required: city, checkIn (YYYY-MM-DD), checkOut (YYYY-MM-DD).
    Optional: minStars (1-5), maxPrice (per night USD), amenities (e.g. ["wifi","pool","breakfast"]), availableOnly (default true — only available hotels), adults, children, rooms.
    Compute checkOut from check-in + nights when the user gives a duration — do NOT ask.
    Always pass availableOnly: true unless the user explicitly wants unavailable options too.`,
  inputSchema: HotelInputSchema,
  outputSchema: HotelSearchResultSchema.or(ToolErrorSchema),
  execute: async (inputData) => {
    try {
      return await searchHotels(inputData as HotelInput);
    } catch (error) {
      return {
        error: error instanceof AppError ? error.message : TOOL_ERROR_MESSAGES.HOTELS,
      };
    }
  },
  toModelOutput: (output) => {
    if ('error' in output) return TOOL_ERROR_OUTPUT;
    if (output.results.length === 0) return TOOL_NO_RESULTS_OUTPUT;
    return TOOL_READY_OUTPUT;
  },
});
