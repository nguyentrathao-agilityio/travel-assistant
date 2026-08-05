import type { StructuredToolInterface } from '@langchain/core/tools';

// Prompts
import { EXPLORE_AGENT_TOOLS_PROMPT } from '@/prompts';

// Tools
import { destinationExplorerTool, knowledgeSearchTool, placesTool, tipsTool } from '@/tools';

// Utils
import { createSpecializedAgent } from '@/utils';

export const EXPLORE_AGENT_TOOLS: StructuredToolInterface[] = [
  destinationExplorerTool,
  placesTool,
  tipsTool,
  knowledgeSearchTool,
];

export const exploreAgent = createSpecializedAgent(
  EXPLORE_AGENT_TOOLS,
  {
    toolsSection: EXPLORE_AGENT_TOOLS_PROMPT,
  },
  'explore'
);
