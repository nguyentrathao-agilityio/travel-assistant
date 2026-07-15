import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { TRAVEL_AGENT_PROMPT } from '../prompts/travel';

// Utils
import { buildInstructions } from '@/utils';

// Tools
import {
  flightsTool,
  weatherTool,
  routeTool,
  placesTool,
  localTipsTool,
  hotelTool,
  tripSummaryTool,
  destinationExplorerTool,
  ragQueryTool,
} from '@/tools';
import type { Tool } from '@mastra/core/tools';

// Stores
import { storage } from '../stores';

const ragTool = ragQueryTool as Tool<any, any>;

export const travelAgent = new Agent({
  id: 'travel-agent',
  name: 'travelAgent',
  instructions: async ({ requestContext }) =>
    buildInstructions(TRAVEL_AGENT_PROMPT, requestContext),
  model: process.env.OPENAI_MODEL ?? 'openai/gpt-4o-mini',
  tools: {
    weatherTool,
    flightsTool,
    routeTool,
    placesTool,
    localTipsTool,
    hotelTool,
    tripSummaryTool,
    destinationExplorerTool,
    ragQueryTool: ragTool,
  },
  memory: new Memory({
    storage,
    options: {
      lastMessages: 20,
      generateTitle: true,
    },
  }),
});
