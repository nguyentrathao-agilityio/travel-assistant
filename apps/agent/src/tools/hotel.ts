import { tool } from '@langchain/core/tools';

// Schemas
import { HotelInputSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES } from '@/constants';

// Services
import { searchHotels } from '@/services/hotel';

// Utils
import { executeReadTool } from '@/utils/tool-contract';

export const hotelTool = tool(
  async (input) => executeReadTool(searchHotels(input), 'travel-api', TOOL_ERROR_MESSAGES.HOTELS),
  {
    name: TOOL_NAMES.HOTEL,
    description: `Search available hotels for a destination with flexible filters.
    Required:
      - city
      - checkIn (YYYY-MM-DD)
      - checkOut (YYYY-MM-DD)

    Optional:
      - minStars (1-5)
      - maxPrice (per night, USD)
      - amenities (e.g. ["wifi","pool","breakfast"])
      - availableOnly (default true — only available hotels)
      - adults
      - children
      - rooms

    Rules:
      - Compute checkOut from check-in + nights when the user gives a duration — do NOT ask.
      - Always pass availableOnly: true unless the user explicitly wants unavailable options too.
      - Only call when city, checkIn, and checkOut are known.`,
    schema: HotelInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
