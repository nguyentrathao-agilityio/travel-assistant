import type { StructuredToolInterface } from '@langchain/core/tools';

import { HOTEL_BOOKING_AGENT_TOOLS_PROMPT } from '../../prompts';
import { bookHotelTool } from '../../tools';
import { createSpecializedAgent } from '../../utils';

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
