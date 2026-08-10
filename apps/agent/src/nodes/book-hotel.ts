// Utils
import { createSpecializedAgent } from '@/utils';

import { AGENT_CONFIGS } from '@/constants/agent-config';

export const HOTEL_BOOKING_AGENT_TOOLS = AGENT_CONFIGS.bookHotel.tools;

export const hotelBookingAgent = createSpecializedAgent(AGENT_CONFIGS.bookHotel);
