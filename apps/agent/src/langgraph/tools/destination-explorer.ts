import { tool } from '@langchain/core/tools';

import { getDestinationExplorer } from '../services/destination-explorer';
import { DestinationExplorerInputSchema } from '../schemas/destination-explorer';
import { TOOL_ERROR_MESSAGES } from '../constants';

export const destinationExplorerTool = tool(
  async (input) => {
    try {
      const result = await getDestinationExplorer(input);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.DESTINATION_EXPLORER,
      });
    }
  },
  {
    name: 'destinationExplorerTool',
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
    returnDirect: true,
  }
);
