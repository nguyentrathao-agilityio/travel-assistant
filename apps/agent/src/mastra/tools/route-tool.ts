import { createTool } from '@mastra/core/tools';

// Services
import { getRoute } from '@/services';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_IDS } from '@/constants';

// Schemas
import { RouteResultSchema } from '@repo/schemas';
import { RouteInputSchema, ToolErrorSchema } from '@/schemas';

// Utils
import { AppError } from '@/utils';
import { TOOL_ERROR_OUTPUT, TOOL_NO_RESULTS_OUTPUT, TOOL_READY_OUTPUT } from '@/utils';

export const routeTool = createTool({
  id: TOOL_IDS.ROUTE,
  description: `Build a landmark tour itinerary for a city — ordered stops with travel times and transport modes.
    Required: city. Optional: maxStops (2-8, defaults to 5).
    Only call this tool when city is available.`,
  inputSchema: RouteInputSchema,
  outputSchema: RouteResultSchema.or(ToolErrorSchema),
  execute: async (inputData) => {
    try {
      return await getRoute(inputData);
    } catch (error) {
      return {
        error: error instanceof AppError ? error.message : TOOL_ERROR_MESSAGES.ROUTE,
      };
    }
  },
  toModelOutput: (output) => {
    if ('error' in output) return TOOL_ERROR_OUTPUT;
    if (output.stops.length === 0) return TOOL_NO_RESULTS_OUTPUT;
    return TOOL_READY_OUTPUT;
  },
});
