import { tool } from '@langchain/core/tools';

// Constants
import { TOOL_NAMES } from '@repo/constants';
import { TOOL_ERROR_MESSAGES, TOOL_PROVIDERS, TOOL_RESPONSE_FORMAT } from '@/constants';

// Schemas
import { FlightInputSchema, FlightToolSchema } from '@/schemas';

// Services
import { searchFlights } from '@/services/flights';

// Utils
import { parseToolInput } from '@/utils';
import { executeReadTool } from '@/utils/tool';

export const flightsTool = tool(
  async (input) =>
    executeReadTool(
      parseToolInput(FlightInputSchema, input).then(searchFlights),
      TOOL_PROVIDERS.TRAVEL_API,
      TOOL_ERROR_MESSAGES.FLIGHTS
    ),
  {
    name: TOOL_NAMES.FLIGHTS,
    description: `Search available flights between two airports on a given date.
    Required:
      - origin (IATA 3-letter code)
      - destination (IATA 3-letter code)
      - departure_date (YYYY-MM-DD)

    Optional:
      - adults (default 1 — do NOT ask)
      - return_date (YYYY-MM-DD — include for round trips)
      - airline
      - max_price
      - max_stops

    Rules:
      - Multi-airport cities: default to the primary hub unless the user specifies otherwise — Bangkok→BKK (Suvarnabhumi), not DMK (Don Mueang); Tokyo→NRT, not HND.
      - If a city has no airport (e.g. Hội An), use the nearest hub (e.g. DAD).
      - If unsure of the correct IATA code, ask the user which airport they prefer.
      - Only call when all required fields are present.`,
    schema: FlightToolSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
