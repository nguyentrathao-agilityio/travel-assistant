import { createTool } from '@mastra/core/tools';

// Schemas
import { TripSummaryResultSchema } from '@repo/schemas';
import { ToolErrorSchema, TripSummaryInputSchema } from '@/schemas';

// Utils
import { AppError } from '@/utils';
import { makeToolOutput, TOOL_ERROR_OUTPUT, TOOL_READY_OUTPUT } from '@/utils';

// Workflow
import { tripSummaryWorkflow } from '@/workflows';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_IDS } from '@/constants';

export const tripSummaryTool = createTool({
  id: TOOL_IDS.TRIP_SUMMARY,
  description: `Generate a full trip summary — cheapest flight + highest-rated hotel + landmark route + cost estimate in one unified result.
    Use this as the SINGLE entry point for any full trip / itinerary / travel schedule request.
    Do NOT call flightsTool, hotelTool, or routeTool separately before or after this.
    This does NOT include a places list or local tips — use placesTool / localTipsTool separately for those.
    Required: destination in ASCII English without diacritics (e.g. "Da Nang" not "Đà Nẵng", "Ho Chi Minh City" not "TP HCM").
    flightOrigin: IATA code of the departure airport. If not in context, ask the user "Where are you flying from?" BEFORE calling this tool — without it, no flight will appear in the summary. Set skipFlights: true instead only if the user has already booked a flight.
    Optional: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), travelers, skipHotel (true if user already has a hotel booked).`,
  inputSchema: TripSummaryInputSchema,
  outputSchema: TripSummaryResultSchema.or(ToolErrorSchema),
  execute: async (input) => {
    try {
      const run = await tripSummaryWorkflow.createRun();
      const result = await run.start({ inputData: input });

      if (result.status !== 'success') {
        return { error: TOOL_ERROR_MESSAGES.TRIP_SUMMARY };
      }

      return result.result;
    } catch (error) {
      return {
        error: error instanceof AppError ? error.message : TOOL_ERROR_MESSAGES.TRIP_SUMMARY,
      };
    }
  },
  toModelOutput: (output) => {
    if (!output || 'error' in output) return TOOL_ERROR_OUTPUT;
    if (!output.destination) {
      return makeToolOutput(
        'Trip summary could not be generated. Tell the user, then ask for: destination city, travel dates (start and end), and number of travelers.'
      );
    }
    return TOOL_READY_OUTPUT;
  },
});
