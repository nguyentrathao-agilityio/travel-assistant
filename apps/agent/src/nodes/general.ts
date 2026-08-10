// Utils
import { createSpecializedAgent } from '@/utils';

import { AGENT_CONFIGS } from '@/constants/agent-config';

export const GENERAL_AGENT_TOOLS = AGENT_CONFIGS.general.tools;

export const generalAgent = createSpecializedAgent(AGENT_CONFIGS.general);
