import { tool } from '@langchain/core/tools';

import { getWeather } from '../services/weather';
import { WeatherInputSchema } from '../schemas/weather';
import { contentAndArtifact, TOOL_ERROR_MESSAGES } from '../constants';

export const weatherTool = tool(
  async ({ city, days }) => {
    try {
      const result = await getWeather({ city, days });
      return contentAndArtifact(result);
    } catch (error) {
      return contentAndArtifact({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.WEATHER,
      });
    }
  },
  {
    name: 'weatherTool',
    description: `Get current weather conditions and forecast for a destination.
    Required: city.
    Optional: days (1-16, defaults to 5).

    This tool takes a day-count, not specific calendar dates. For a relative time reference
    (e.g. "next week", "in 3 days", "this weekend"), use the client's current date already given
    in context to compute a days value that covers the requested period — do not ask the user for
    exact dates just to satisfy this tool.

    Only call this tool when city is available.`,
    schema: WeatherInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
