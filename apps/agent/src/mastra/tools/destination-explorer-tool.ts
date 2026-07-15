import { createTool } from '@mastra/core/tools';

// Schemas
import { DestinationExplorerResultSchema, DestinationExplorerInputSchema } from '@repo/schemas';
import { ToolErrorSchema } from '@/schemas';

// Utils
import { AppError } from '@/utils';
import { makeToolOutput, TOOL_ERROR_OUTPUT, TOOL_READY_OUTPUT } from '@/utils';

// Workflow
import { destinationExplorerWorkflow } from '@/workflows';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_IDS } from '@/constants';

export const destinationExplorerTool = createTool({
  id: TOOL_IDS.DESTINATION_EXPLORER,
  description: `Explore a destination in one shot — top places, local tips, and weather forecast all in one unified card.
    Use ONLY when the user asks for a destination overview / "tell me about X" / "explore X" / "what's X like".
    Do NOT call placesTool, localTipsTool, or weatherTool separately before or after this.
    Required: city in ASCII English without diacritics (e.g. "Da Nang" not "Da Nang diacritics", "Ho Chi Minh City" not "TP HCM").
    Optional: country (inferred from places if omitted), forecastDays (1-16, auto-computed from outdoor place count).`,
  inputSchema: DestinationExplorerInputSchema,
  outputSchema: DestinationExplorerResultSchema.or(ToolErrorSchema),
  execute: async (input) => {
    try {
      const run = await destinationExplorerWorkflow.createRun();
      const result = await run.start({ inputData: input });

      if (result.status !== 'success') {
        return { error: TOOL_ERROR_MESSAGES.DESTINATION_EXPLORER };
      }

      return result.result;
    } catch (error) {
      return {
        error: error instanceof AppError ? error.message : TOOL_ERROR_MESSAGES.DESTINATION_EXPLORER,
      };
    }
  },
  toModelOutput: (output) => {
    if (!output || 'error' in output) return TOOL_ERROR_OUTPUT;
    if (!output.city) {
      return makeToolOutput(
        'Destination explorer could not run. Tell the user, then ask for the destination city.'
      );
    }
    return TOOL_READY_OUTPUT;
  },
});
