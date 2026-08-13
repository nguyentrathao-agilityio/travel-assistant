import type { StructuredToolInterface } from '@langchain/core/tools';

// Constants
import type { DomainAgentNodeName } from './agents';

// Prompts
import {
  CANCEL_BOOKING_AGENT_TOOLS_PROMPT,
  EXPLORE_AGENT_TOOLS_PROMPT,
  FLIGHT_BOOKING_AGENT_TOOLS_PROMPT,
  GENERAL_AGENT_PROMPT_SUFFIX,
  HOTEL_BOOKING_AGENT_TOOLS_PROMPT,
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
  approvalTools?: string[];
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
  bookFlight: {
    name: 'bookFlight',
    tools: [bookFlightTool],
    approvalTools: ['bookFlightTool'],
    prompt: {
      toolsSection: FLIGHT_BOOKING_AGENT_TOOLS_PROMPT,
      includeBookingRules: true,
      includeBookingContext: true,
    },
  },
  bookHotel: {
    name: 'bookHotel',
    tools: [bookHotelTool],
    approvalTools: ['bookHotelTool'],
    prompt: {
      toolsSection: HOTEL_BOOKING_AGENT_TOOLS_PROMPT,
      includeBookingRules: true,
      includeBookingContext: true,
    },
  },
  cancelBooking: {
    name: 'cancelBooking',
    tools: [cancelBookingTool],
    approvalTools: ['cancelBookingTool'],
    prompt: { toolsSection: CANCEL_BOOKING_AGENT_TOOLS_PROMPT },
  },
} satisfies Record<DomainAgentNodeName, SpecializedAgentConfig>;
