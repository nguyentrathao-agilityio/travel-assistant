import { tool } from '@langchain/core/tools';

// Schemas
import { RouteInputSchema } from '@/schemas';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES } from '@/constants';

// Services
import { getRoute } from '@/services/route';

// Utils
import { executeReadTool } from '@/utils/tool-contract';

export const routeTool = tool(
  async (input) => executeReadTool(getRoute(input), 'travel-api', TOOL_ERROR_MESSAGES.ROUTE),
  {
    name: TOOL_NAMES.ROUTE,
    description: `Build a landmark tour itinerary for a city — ordered stops with travel times and transport modes.
    Required: city.
    Optional: maxStops (2-8, defaults to 5).
    
    Only call this tool when city is available.`,
    schema: RouteInputSchema,
    responseFormat: 'content_and_artifact',
  }
);
