import { tool } from '@langchain/core/tools';

import { searchFlights } from '../services/flights';
import { FlightInputSchema } from '../schemas/flights';
import { TOOL_ERROR_MESSAGES } from '../constants';

export const flightsTool = tool(
  async (input) => {
    try {
      const result = await searchFlights(input);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.FLIGHTS,
      });
    }
  },
  {
    name: 'flightsTool',
    description: `Search available flights between two airports on a given date.
  Required: origin (IATA 3-letter code), destination (IATA 3-letter code), departure_date (YYYY-MM-DD).
  Optional: adults (default 1 — do NOT ask), return_date (YYYY-MM-DD — include for round trips), airline, max_price, max_stops.
  IATA conversion: Hanoi→HAN, Ho Chi Minh City/Saigon→SGN, Da Nang→DAD, Phu Quoc→PQC,
    Bangkok→BKK (Suvarnabhumi) or DMK (Don Mueang), Phuket→HKT, Chiang Mai→CNX,
    Singapore→SIN, Kuala Lumpur→KUL, Bali/Denpasar→DPS, Tokyo→NRT or HND, Osaka→KIX, Seoul→ICN.
  If a city has no airport (e.g. Hội An), use the nearest hub (e.g. DAD).
  If unsure of the correct IATA code, ask the user which airport they prefer.
  Only call when all required fields are present.`,
    schema: FlightInputSchema,
    returnDirect: true,
  }
);
