import { z } from 'zod';

// Constants
import { API_URL, ENDPOINTS, ERROR_MESSAGES } from '@/constants';

// Schemas
import {
  ApiFlightSearchResponseSchema,
  FlightInputSchema,
  FlightSearchResultSchema,
} from '@/schemas';

// Utils
import { buildSearchParams, mapFlight } from '@/utils';

/**
 * Calls the external flights search API and returns validated, camelCase results.
 * Throws on missing config, non-OK response, or invalid response shape.
 */
export const searchFlights = async (
  input: z.infer<typeof FlightInputSchema>
): Promise<z.infer<typeof FlightSearchResultSchema>> => {
  if (!API_URL) throw new Error(ERROR_MESSAGES.NO_API_URL);

  try {
    const res = await fetch(
      `${API_URL}${ENDPOINTS.FLIGHTS}/search?${buildSearchParams(input).toString()}`
    );

    if (!res.ok) throw new Error(ERROR_MESSAGES.SEARCH_FAILED(res.status, res.statusText));

    const raw: unknown = await res.json();
    const parsed = ApiFlightSearchResponseSchema.safeParse(raw);
    if (!parsed.success) throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);

    const { data } = parsed;

    return {
      count: data.count,
      results: data.results.map(mapFlight),
      ...(data.return_count != null && { returnCount: data.return_count }),
      ...(data.return_results != null && { returnResults: data.return_results.map(mapFlight) }),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(ERROR_MESSAGES.UNKNOWN);
  }
};
