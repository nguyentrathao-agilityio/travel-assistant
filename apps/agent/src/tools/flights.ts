import { tool } from '@langchain/core/tools';

// Schemas
import { FlightInputSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES } from '@/constants';

// Services
import { searchFlights } from '@/services/flights';

// Utils
import { executeReadTool } from '@/utils/tool-contract';

export const flightsTool = tool(
  async (input) => executeReadTool(searchFlights(input), 'travel-api', TOOL_ERROR_MESSAGES.FLIGHTS),
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
    schema: FlightInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
