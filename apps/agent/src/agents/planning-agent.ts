import type { StructuredToolInterface } from '@langchain/core/tools';

import { PLANNING_AGENT_TOOLS_PROMPT } from '../constants';
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
} from '../tools';
import { createSpecializedAgent } from './shared/create-agent';

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

export const planningAgent = createSpecializedAgent(PLANNING_AGENT_TOOLS, {
  toolsSection: PLANNING_AGENT_TOOLS_PROMPT,
  includeBookingRules: true,
  includeBookingContext: true,
  includeMemoryContext: true,
});
