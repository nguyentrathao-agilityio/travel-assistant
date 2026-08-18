import { tool } from '@langchain/core/tools';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES, TOOL_RESPONSE_FORMAT } from '@/constants';

// Schemas
import { WeatherInputSchema } from '@/schemas';

// Services
import { getWeather } from '@/services/weather';

// Utils
import { executeReadTool } from '@/utils/tool';

export const weatherTool = tool(
  async ({ city, days }) =>
    executeReadTool(getWeather({ city, days }), 'weather-api', TOOL_ERROR_MESSAGES.WEATHER),
  {
    name: TOOL_NAMES.WEATHER,
    description: `Get current weather conditions and forecast for a destination.
    Required: city.
    Optional: days (1-16, defaults to 5).

    This tool takes a day-count, not specific calendar dates. Never ask the user for exact dates
    just to satisfy this tool — compute days yourself from the client's current date already given
    in context: "this weekend" -> days through the coming Sat/Sun, "next week" -> 7, "in N days" ->
    N, "the next two weeks" -> 14 (capped at 16). If no timeframe is mentioned, omit days and let
    it default to 5.

    Only call this tool when city is available.`,
    schema: WeatherInputSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
