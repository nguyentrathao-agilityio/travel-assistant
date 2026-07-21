import { createAgent, dynamicSystemPromptMiddleware } from 'langchain';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

// State
import { GraphState } from './state';

// Tools
import {
  weatherTool,
  flightsTool,
  hotelTool,
  routeTool,
  placesTool,
  tipsTool,
  tripSummaryTool,
  destinationExplorerTool,
} from './tools';

// LLM
import { createChatModel } from './llm';

// Persistence
import { OPENAI_API_KEY, POSTGRES_URL } from './constants';

// Utils
import { buildSystemPrompt } from './utils';
import type { GraphStateType } from './state';

const agent = createAgent({
  model: createChatModel({ apiKey: OPENAI_API_KEY! }),
  tools: [
    weatherTool,
    flightsTool,
    hotelTool,
    routeTool,
    placesTool,
    tipsTool,
    tripSummaryTool,
    destinationExplorerTool,
  ],
  stateSchema: GraphState,
  middleware: [
    dynamicSystemPromptMiddleware((state) => buildSystemPrompt(state as unknown as GraphStateType)),
  ],
  checkpointer: PostgresSaver.fromConnString(POSTGRES_URL!),
});

export const graph = agent.graph;
