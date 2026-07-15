import { createTool } from '@mastra/core/tools';

// Services
import { getLocalTips } from '@/services';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_IDS } from '@/constants';

// Schemas
import { TipsResultSchema } from '@repo/schemas';
import { TipsInputSchema, ToolErrorSchema } from '@/schemas';

// Utils
import { AppError } from '@/utils';
import { TOOL_ERROR_OUTPUT, TOOL_NO_RESULTS_OUTPUT, TOOL_READY_OUTPUT } from '@/utils';

export const localTipsTool = createTool({
  id: TOOL_IDS.LOCAL_TIPS,
  description: `Get local travel tips for a city or country — covering transport, money, safety, culture, food, connectivity, health, etiquette, best time to visit, and language.
    Required: country (not city — always resolve: Da Nang→Vietnam, Bangkok→Thailand, Bali→Indonesia, etc.).
    Optional: city (pass when available for more specific results), category (transport|money|safety|culture|food|connectivity|health|etiquette|best_time|language — use when user asks about a specific topic), essentialOnly.
    Only call when country is known.`,
  inputSchema: TipsInputSchema,
  outputSchema: TipsResultSchema.or(ToolErrorSchema),
  execute: async (inputData) => {
    try {
      return await getLocalTips(inputData);
    } catch (error) {
      return {
        error: error instanceof AppError ? error.message : TOOL_ERROR_MESSAGES.LOCAL_TIPS,
      };
    }
  },
  toModelOutput: (output) => {
    if ('error' in output) return TOOL_ERROR_OUTPUT;
    if (output.count === 0) return TOOL_NO_RESULTS_OUTPUT;
    return TOOL_READY_OUTPUT;
  },
});
