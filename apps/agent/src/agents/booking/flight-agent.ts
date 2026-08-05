import type { StructuredToolInterface } from '@langchain/core/tools';

// Prompts
import { FLIGHT_BOOKING_AGENT_TOOLS_PROMPT } from '@/prompts';

// Tools
import { bookFlightTool } from '@/tools';

// Utils
import { createSpecializedAgent } from '@/utils';

export const FLIGHT_BOOKING_AGENT_TOOLS: StructuredToolInterface[] = [bookFlightTool];

export const flightBookingAgent = createSpecializedAgent(
  FLIGHT_BOOKING_AGENT_TOOLS,
  {
    toolsSection: FLIGHT_BOOKING_AGENT_TOOLS_PROMPT,
    includeBookingRules: true,
    includeBookingContext: true,
  },
  'bookFlight'
);
