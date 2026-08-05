// Utils
import { createSpecializedAgent } from '@/utils';

import { AGENT_CONFIGS } from './config';

export const EXPLORE_AGENT_TOOLS = AGENT_CONFIGS.explore.tools;

export const exploreAgent = createSpecializedAgent(AGENT_CONFIGS.explore);
