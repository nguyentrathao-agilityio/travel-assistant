// Constants
import { AGENT_CONFIGS } from '@/constants/agent-config';

// Utils
import { createSpecializedAgent } from '@/utils';

export const BOOKING_AGENT_TOOLS = AGENT_CONFIGS.booking.tools;

export const bookingAgent = createSpecializedAgent(AGENT_CONFIGS.booking);
