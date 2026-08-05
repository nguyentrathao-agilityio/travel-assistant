import type { StructuredToolInterface } from '@langchain/core/tools';

// Prompts
import { PLANNING_AGENT_TOOLS_PROMPT } from '@/prompts';

// Tools
import {
  flightsTool,
  hotelTool,
  knowledgeSearchTool,
  placesTool,
  routeTool,
  transferToBookFlightTool,
  transferToBookHotelTool,
  tripSummaryTool,
  weatherTool,
} from '@/tools';

// Utils
import { createSpecializedAgent } from '@/utils';

export const PLANNING_AGENT_TOOLS: StructuredToolInterface[] = [
  flightsTool,
  hotelTool,
  placesTool,
  routeTool,
  weatherTool,
  tripSummaryTool,
  knowledgeSearchTool,
  transferToBookFlightTool,
  transferToBookHotelTool,
];

export const planningAgent = createSpecializedAgent(
  PLANNING_AGENT_TOOLS,
  {
    toolsSection: PLANNING_AGENT_TOOLS_PROMPT,
    includeBookingRules: true,
    includeBookingContext: true,
    includeMemoryContext: true,
  },
  'plan'
);
