import { tool } from '@langchain/core/tools';

// Schemas
import { TripSummaryInputSchema, TripSummaryToolSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES, TOOL_PROVIDERS, TOOL_RESPONSE_FORMAT } from '@/constants';

// Services
import { getTripSummary } from '@/services/trip-summary';

// Utils
import { parseToolInput } from '@/utils';
import { executeReadTool } from '@/utils/tool-contract';

export const tripSummaryTool = tool(
  async (input) =>
    executeReadTool(
      parseToolInput(TripSummaryInputSchema, input).then(getTripSummary),
      TOOL_PROVIDERS.TRAVEL_API,
      TOOL_ERROR_MESSAGES.TRIP_SUMMARY
    ),
  {
    name: TOOL_NAMES.TRIP_SUMMARY,
    description: `Generate a full trip summary — cheapest flight + highest-rated hotel + landmark route + cost estimate in one unified result.
    Rules:
      - Use this as the SINGLE entry point for any full trip / itinerary / travel schedule request.
      - Do NOT call flightsTool, hotelTool, or routeTool separately before or after this.
      - This does NOT include a places list or local tips — use placesTool / localTipsTool separately for those.

    Required:
      - destination, in ASCII English without diacritics (e.g. "Da Nang" not "Đà Nẵng", "Ho Chi Minh City" not "TP HCM")
      - flightOrigin: IATA code of the departure airport. If not in context, ask "Where are you flying from?" BEFORE calling this tool — without it, no flight will appear in the summary. Set skipFlights: true instead only if the user has already booked a flight.

    Optional (do NOT ask the user for these before calling — omit whichever aren't already known):
      - startDate (YYYY-MM-DD)
      - endDate (YYYY-MM-DD)
      - travelers
      - skipHotel (true if user already has a hotel booked)

    Once destination and (flightOrigin or skipFlights) are known, call immediately — missing
    optional fields are not a reason to ask another question first.`,
    schema: TripSummaryToolSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
