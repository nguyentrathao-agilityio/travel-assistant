import { tool } from '@langchain/core/tools';

import { searchHotels } from '../services/hotel';
import { HotelInputSchema } from '../schemas/hotel';
import { TOOL_ERROR_MESSAGES } from '../constants';

export const hotelTool = tool(
  async (input) => {
    try {
      const result = await searchHotels(input);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.HOTELS,
      });
    }
  },
  {
    name: 'hotelTool',
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
    returnDirect: true,
  }
);
