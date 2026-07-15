import { createTool } from '@mastra/core/tools';

// Services
import { searchFlights } from '@/services';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_IDS } from '@/constants';

// Schemas
import {
  FlightInputSchema,
  FlightInput,
  FlightSearchResultSchema,
  ToolErrorSchema,
} from '@/schemas';

// Utils
import { AppError } from '@/utils';
import { TOOL_ERROR_OUTPUT, TOOL_NO_RESULTS_OUTPUT, TOOL_READY_OUTPUT } from '@/utils';

export const flightsTool = createTool({
  id: TOOL_IDS.FLIGHTS,
  description: `Search available flights between two airports on a given date.
  Required: origin (IATA 3-letter code), destination (IATA 3-letter code), departure_date (YYYY-MM-DD).
  Optional: adults (default 1 — do NOT ask), return_date (YYYY-MM-DD — include for round trips), airline, max_price, max_stops.
  IATA conversion: Hanoi→HAN, Ho Chi Minh City/Saigon→SGN, Da Nang→DAD, Phu Quoc→PQC,
    Bangkok→BKK (Suvarnabhumi) or DMK (Don Mueang), Phuket→HKT, Chiang Mai→CNX,
    Singapore→SIN, Kuala Lumpur→KUL, Bali/Denpasar→DPS, Tokyo→NRT or HND, Osaka→KIX, Seoul→ICN.
  If a city has no airport (e.g. Hội An), use the nearest hub (e.g. DAD).
  If unsure of the correct IATA code, ask the user which airport they prefer.
  Only call when all required fields are present.`,
  inputSchema: FlightInputSchema,
  outputSchema: FlightSearchResultSchema.or(ToolErrorSchema),
  execute: async (input) => {
    try {
      return await searchFlights(input as FlightInput);
    } catch (error) {
      return {
        error: error instanceof AppError ? error.message : TOOL_ERROR_MESSAGES.FLIGHTS,
      };
    }
  },
  toModelOutput: (output) => {
    if ('error' in output) return TOOL_ERROR_OUTPUT;
    if (output.count === 0) return TOOL_NO_RESULTS_OUTPUT;
    return TOOL_READY_OUTPUT;
  },
});
