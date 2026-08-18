import { tool } from '@langchain/core/tools';

// Constants
import { TOOL_ERROR_MESSAGES, TOOL_NAMES, TOOL_PROVIDERS, TOOL_RESPONSE_FORMAT } from '@/constants';

// Schemas
import { TipsInputSchema } from '@/schemas';

// Services
import { getLocalTips } from '@/services/tips';

// Utils
import { executeReadTool } from '@/utils/tool-contract';

export const tipsTool = tool(
  async (input) =>
    executeReadTool(getLocalTips(input), TOOL_PROVIDERS.TRAVEL_API, TOOL_ERROR_MESSAGES.LOCAL_TIPS),
  {
    name: TOOL_NAMES.LOCAL_TIPS,
    description: `Get informal, practical local tips for a city or country — covering transport, money, street safety, culture, food, connectivity, health, etiquette, best time to visit, and language.
    Do NOT use for visa/entry/immigration, required documents, official sources, knowledge-base
    questions, or general safety/planning principles; use knowledgeSearchTool for those.

    Required: country (not city — always resolve, e.g. Da Nang → Vietnam, Bangkok → Thailand, Bali → Indonesia).

    Optional:
      - city (pass when available for more specific results)
      - category (transport | money | safety | culture | food | connectivity | health | etiquette | best_time | language — use when user asks about a specific topic)
      - essential_only

    Only call when country is known.`,
    schema: TipsInputSchema,
    responseFormat: TOOL_RESPONSE_FORMAT.CONTENT_AND_ARTIFACT,
  }
);
