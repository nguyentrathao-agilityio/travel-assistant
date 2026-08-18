import { tool } from '@langchain/core/tools';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES, TOOL_PROVIDERS, TOOL_RESPONSE_FORMAT } from '@/constants';

// Schemas
import { RouteInputSchema } from '@/schemas';

// Services
import { getRoute } from '@/services/route';

// Utils
import { executeReadTool } from '@/utils/tool';

export const routeTool = tool(
  async (input) =>
    executeReadTool(getRoute(input), TOOL_PROVIDERS.TRAVEL_API, TOOL_ERROR_MESSAGES.ROUTE),
  {
    name: TOOL_NAMES.ROUTE,
    description: `Build a landmark tour itinerary for a city — ordered stops with travel times and transport modes.
    Required: city.
    Optional: maxStops (2-8, defaults to 5).
    
    Only call this tool when city is available.`,
    schema: RouteInputSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
