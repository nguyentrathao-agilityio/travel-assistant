import type { StructuredToolInterface } from '@langchain/core/tools';

import { EXPLORE_AGENT_TOOLS_PROMPT } from '../constants';
import { destinationExplorerTool, knowledgeSearchTool, placesTool, tipsTool } from '../tools';
import { createSpecializedAgent } from './shared/create-agent';

export const EXPLORE_AGENT_TOOLS: StructuredToolInterface[] = [
  destinationExplorerTool,
  placesTool,
  tipsTool,
  knowledgeSearchTool,
];

export const exploreAgent = createSpecializedAgent(EXPLORE_AGENT_TOOLS, {
  toolsSection: EXPLORE_AGENT_TOOLS_PROMPT,
});
