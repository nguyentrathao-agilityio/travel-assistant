// Utils
import { createSpecializedAgent } from '@/utils';

import { AGENT_CONFIGS } from '@/constants/agent-config';

export const PLANNING_AGENT_TOOLS = AGENT_CONFIGS.plan.tools;

export const planningAgent = createSpecializedAgent(AGENT_CONFIGS.plan);
