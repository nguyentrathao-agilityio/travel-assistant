import type { StructuredToolInterface } from '@langchain/core/tools';

import { CANCEL_BOOKING_AGENT_TOOLS_PROMPT } from '../../constants';
import { cancelBookingTool } from '../../tools';
import { createSpecializedAgent } from '../shared/create-agent';

export const CANCEL_BOOKING_AGENT_TOOLS: StructuredToolInterface[] = [cancelBookingTool];

export const cancelBookingAgent = createSpecializedAgent(CANCEL_BOOKING_AGENT_TOOLS, {
  toolsSection: CANCEL_BOOKING_AGENT_TOOLS_PROMPT,
});
