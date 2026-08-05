// Utils
import { createSpecializedAgent } from '@/utils';

import { AGENT_CONFIGS } from '../config';

export const CANCEL_BOOKING_AGENT_TOOLS = AGENT_CONFIGS.cancelBooking.tools;

export const cancelBookingAgent = createSpecializedAgent(AGENT_CONFIGS.cancelBooking);
