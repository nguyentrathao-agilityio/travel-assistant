import type { StructuredToolInterface } from '@langchain/core/tools';

import { GENERAL_AGENT_PROMPT_SUFFIX } from '../prompts';
import { createSpecializedAgent } from '../utils';

export const GENERAL_AGENT_TOOLS: StructuredToolInterface[] = [];

export const generalAgent = createSpecializedAgent(
  GENERAL_AGENT_TOOLS,
  {
    toolsSection: GENERAL_AGENT_PROMPT_SUFFIX,
  },
  'general'
);
