import { tool } from '@langchain/core/tools';

import { getWeather } from '../services/weather';
import { WeatherInputSchema } from '../schemas/weather';
import { TOOL_ERROR_MESSAGES } from '../constants';

export const weatherTool = tool(
  async ({ city, days }) => {
    try {
      const result = await getWeather({ city, days });
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.WEATHER,
      });
    }
  },
  {
    name: 'weatherTool',
    description: `Get current weather conditions and forecast for a destination.
      Required: city. Optional: days (1-16, defaults to 5).
      Only call this tool when city is available.`,
    schema: WeatherInputSchema,
  }
);
