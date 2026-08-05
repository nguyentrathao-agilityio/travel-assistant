import type { StructuredToolInterface } from '@langchain/core/tools';

// Prompts
import { HOTEL_BOOKING_AGENT_TOOLS_PROMPT } from '@/prompts';

// Tools
import { bookHotelTool } from '@/tools';

// Utils
import { createSpecializedAgent } from '@/utils';

export const HOTEL_BOOKING_AGENT_TOOLS: StructuredToolInterface[] = [bookHotelTool];

export const hotelBookingAgent = createSpecializedAgent(
  HOTEL_BOOKING_AGENT_TOOLS,
  {
    toolsSection: HOTEL_BOOKING_AGENT_TOOLS_PROMPT,
    includeBookingRules: true,
    includeBookingContext: true,
  },
  'bookHotel'
);
