import type { StructuredToolInterface } from '@langchain/core/tools';

import { FLIGHT_BOOKING_AGENT_TOOLS_PROMPT } from '../../constants';
import { bookFlightTool } from '../../tools';
import { createSpecializedAgent } from '../shared/create-agent';

export const FLIGHT_BOOKING_AGENT_TOOLS: StructuredToolInterface[] = [bookFlightTool];

export const flightBookingAgent = createSpecializedAgent(FLIGHT_BOOKING_AGENT_TOOLS, {
  toolsSection: FLIGHT_BOOKING_AGENT_TOOLS_PROMPT,
  includeBookingRules: true,
  includeBookingContext: true,
});
