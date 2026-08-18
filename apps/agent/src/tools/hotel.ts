import { tool } from '@langchain/core/tools';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES, TOOL_PROVIDERS, TOOL_RESPONSE_FORMAT } from '@/constants';

// Schemas
import { HotelInputSchema, HotelToolSchema } from '@/schemas';

// Services
import { searchHotels } from '@/services/hotel';

// Utils
import { parseToolInput } from '@/utils';
import { executeReadTool } from '@/utils/tool-contract';

export const hotelTool = tool(
  async (input) =>
    executeReadTool(
      parseToolInput(HotelInputSchema, input).then(searchHotels),
      TOOL_PROVIDERS.TRAVEL_API,
      TOOL_ERROR_MESSAGES.HOTELS
    ),
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
    schema: HotelToolSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
