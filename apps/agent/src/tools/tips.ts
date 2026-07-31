import { tool } from '@langchain/core/tools';

import { getLocalTips } from '../services/tips';
import { TipsInputSchema } from '../schemas/tips';
import { contentAndArtifact, TOOL_ERROR_MESSAGES } from '../constants';

export const tipsTool = tool(
  async (input) => {
    try {
      const result = await getLocalTips(input);
      return contentAndArtifact(result);
    } catch (error) {
      return contentAndArtifact({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.LOCAL_TIPS,
      });
    }
  },
  {
    name: 'localTipsTool',
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
    responseFormat: 'content_and_artifact',
  }
);
