import { tool } from '@langchain/core/tools';

import { getRoute } from '../services/route';
import { RouteInputSchema } from '../schemas/route';
import { contentAndArtifact, TOOL_ERROR_MESSAGES } from '../constants';

export const routeTool = tool(
  async (input) => {
    try {
      const result = await getRoute(input);
      return contentAndArtifact(result);
    } catch (error) {
      return contentAndArtifact({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.ROUTE,
      });
    }
  },
  {
    name: 'routeTool',
    description: `Build a landmark tour itinerary for a city — ordered stops with travel times and transport modes.
    Required: city.
    Optional: maxStops (2-8, defaults to 5).'
    
    Only call this tool when city is available.`,
    schema: RouteInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
