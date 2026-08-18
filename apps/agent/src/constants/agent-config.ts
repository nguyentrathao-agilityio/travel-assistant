import type { StructuredToolInterface } from '@langchain/core/tools';

// Constants
import type { DomainAgentNodeName } from './agents';
import { BOOKING_TOOL_NAMES } from './tools';

// Prompts
import {
  BOOKING_AGENT_TOOLS_PROMPT,
  EXPLORE_AGENT_TOOLS_PROMPT,
  GENERAL_AGENT_PROMPT_SUFFIX,
  PLANNING_AGENT_TOOLS_PROMPT,
  type AgentPromptSections,
} from '@/prompts';

// Tools
import {
  bookFlightTool,
  bookHotelTool,
  cancelBookingTool,
  destinationExplorerTool,
  flightsTool,
  hotelTool,
  knowledgeSearchTool,
  placesTool,
  routeTool,
  tipsTool,
  transferToBookFlightTool,
  transferToBookHotelTool,
  tripSummaryTool,
  weatherTool,
} from '@/tools';

export interface SpecializedAgentConfig {
  name: DomainAgentNodeName;
  tools: StructuredToolInterface[];
  approvalTools?: readonly string[];
  prompt: AgentPromptSections;
}

/** Single source of truth for each domain agent's tools and prompt capabilities. */
export const AGENT_CONFIGS = {
  general: {
    name: 'general',
    tools: [],
    prompt: { toolsSection: GENERAL_AGENT_PROMPT_SUFFIX },
  },
  explore: {
    name: 'explore',
    tools: [destinationExplorerTool, placesTool, tipsTool, knowledgeSearchTool],
    prompt: { toolsSection: EXPLORE_AGENT_TOOLS_PROMPT },
  },
  plan: {
    name: 'plan',
    tools: [
      flightsTool,
      hotelTool,
      placesTool,
      routeTool,
      weatherTool,
      tripSummaryTool,
      knowledgeSearchTool,
      transferToBookFlightTool,
      transferToBookHotelTool,
    ],
    prompt: {
      toolsSection: PLANNING_AGENT_TOOLS_PROMPT,
      includeBookingRules: true,
      includeBookingContext: true,
      includeMemoryContext: true,
    },
  },
  booking: {
    name: 'booking',
    tools: [bookFlightTool, bookHotelTool, cancelBookingTool],
    approvalTools: BOOKING_TOOL_NAMES,
    prompt: {
      toolsSection: BOOKING_AGENT_TOOLS_PROMPT,
      includeBookingRules: true,
      includeBookingContext: true,
    },
  },
} satisfies Record<DomainAgentNodeName, SpecializedAgentConfig>;
