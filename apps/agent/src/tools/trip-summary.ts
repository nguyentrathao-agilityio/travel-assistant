import { tool } from '@langchain/core/tools';

import { getTripSummary } from '../services/trip-summary';
import { TripSummaryInputSchema } from '../schemas/trip-summary';
import { TOOL_ERROR_MESSAGES } from '../constants';

export const tripSummaryTool = tool(
  async (input) => {
    try {
      const result = await getTripSummary(input);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.TRIP_SUMMARY,
      });
    }
  },
  {
    name: 'tripSummaryTool',
    description: `Generate a full trip summary — cheapest flight + highest-rated hotel + landmark route + cost estimate in one unified result.
    Rules:
      - Use this as the SINGLE entry point for any full trip / itinerary / travel schedule request.
      - Do NOT call flightsTool, hotelTool, or routeTool separately before or after this.
      - This does NOT include a places list or local tips — use placesTool / localTipsTool separately for those.

    Required:
      - destination, in ASCII English without diacritics (e.g. "Da Nang" not "Đà Nẵng", "Ho Chi Minh City" not "TP HCM")
      - flightOrigin: IATA code of the departure airport. If not in context, ask "Where are you flying from?" BEFORE calling this tool — without it, no flight will appear in the summary. Set skipFlights: true instead only if the user has already booked a flight.

    Optional:
      - startDate (YYYY-MM-DD)
      - endDate (YYYY-MM-DD)
      - travelers
      - skipHotel (true if user already has a hotel booked)`,
    schema: TripSummaryInputSchema,
    returnDirect: true,
  }
);
