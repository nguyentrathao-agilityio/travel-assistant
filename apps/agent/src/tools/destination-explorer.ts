import { tool } from '@langchain/core/tools';

// Constants
import { TOOL_NAMES } from '@repo/constants';
import { TOOL_ERROR_MESSAGES, TOOL_PROVIDERS, TOOL_RESPONSE_FORMAT } from '@/constants';

// Schemas
import { DestinationExplorerInputSchema } from '@/schemas';

// Services
import { getDestinationExplorer } from '@/services/destination-explorer';

// Utils
import { executeReadTool } from '@/utils/tool';

export const destinationExplorerTool = tool(
  async (input) =>
    executeReadTool(
      getDestinationExplorer(input),
      TOOL_PROVIDERS.TRAVEL_API,
      TOOL_ERROR_MESSAGES.DESTINATION_EXPLORER
    ),
  {
    name: TOOL_NAMES.DESTINATION_EXPLORER,
    description: `Explore a destination in one shot — top places, local tips, and weather forecast all in one unified card.
    Rules:
      - Use ONLY when the user asks for a destination overview / "tell me about X" / "explore X" / "what's X like".
      - Do NOT call placesTool, localTipsTool, or weatherTool separately before or after this.

    Required: city, in ASCII English without diacritics (e.g. "Da Nang" not "Đà Nẵng", "Ho Chi Minh City" not "TP HCM").
    Optional:
      - country (inferred from weather location if omitted)
      - forecastDays (1-16, defaults to 5)

    Only call when city is known.`,
    schema: DestinationExplorerInputSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
