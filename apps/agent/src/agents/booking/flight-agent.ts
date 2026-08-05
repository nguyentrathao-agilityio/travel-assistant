// Utils
import { createSpecializedAgent } from '@/utils';

import { AGENT_CONFIGS } from '../config';

export const FLIGHT_BOOKING_AGENT_TOOLS = AGENT_CONFIGS.bookFlight.tools;

export const flightBookingAgent = createSpecializedAgent(AGENT_CONFIGS.bookFlight);
