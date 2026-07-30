import { createAgent, dynamicSystemPromptMiddleware } from 'langchain';
import { createCopilotkitMiddleware } from '@copilotkit/sdk-js/langgraph';
import type { StructuredToolInterface } from '@langchain/core/tools';

import {
  BOOK_FLIGHT_TOOLS_SECTION,
  BOOK_HOTEL_TOOLS_SECTION,
  CANCEL_BOOKING_TOOLS_SECTION,
  EXPLORE_TOOLS_SECTION,
  GENERAL_SYSTEM_PROMPT_SUFFIX,
  OPENAI_API_KEY,
  PLAN_TOOLS_SECTION,
} from '../constants';
import { createChatModel } from '../llm';
import { memoryStore, searchMemories } from '../services';
import {
  bookFlightTool,
  bookHotelTool,
  cancelBookingTool,
  destinationExplorerTool,
  flightsTool,
  hotelTool,
  knowledgeSearchTool,
  placesTool,
  routeTool,
  tipsTool,
  tripSummaryTool,
  weatherTool,
} from '../tools';
import { GraphState, type GraphStateType } from '../state';
import { buildBranchSystemPrompt, type BranchPromptSections } from '../utils';

export const EXPLORE_TOOLS: StructuredToolInterface[] = [
  destinationExplorerTool,
  placesTool,
  tipsTool,
  knowledgeSearchTool,
];
export const PLAN_TOOLS: StructuredToolInterface[] = [
  flightsTool,
  hotelTool,
  routeTool,
  weatherTool,
  tripSummaryTool,
  knowledgeSearchTool,
];
export const BOOK_FLIGHT_TOOLS: StructuredToolInterface[] = [bookFlightTool];
export const BOOK_HOTEL_TOOLS: StructuredToolInterface[] = [bookHotelTool];
export const CANCEL_BOOKING_TOOLS: StructuredToolInterface[] = [cancelBookingTool];
export const GENERAL_TOOLS: StructuredToolInterface[] = [];

const model = createChatModel({ apiKey: OPENAI_API_KEY! });

const buildBranch = (tools: StructuredToolInterface[], sections: BranchPromptSections) =>
  createAgent({
    model,
    tools,
    stateSchema: GraphState,
    middleware: [
      createCopilotkitMiddleware({ exposeState: false }),
      dynamicSystemPromptMiddleware(async (state) => {
        const memories = sections.includeMemoryContext ? await searchMemories(memoryStore) : [];
        return buildBranchSystemPrompt(state as unknown as GraphStateType, sections, memories);
      }),
    ],
  }).graph;

export const exploreBranch = buildBranch(EXPLORE_TOOLS, { toolsSection: EXPLORE_TOOLS_SECTION });

export const planBranch = buildBranch(PLAN_TOOLS, {
  toolsSection: PLAN_TOOLS_SECTION,
  includeBookingRules: true,
  includeBookingContext: true,
  includeMemoryContext: true,
});

export const bookFlightBranch = buildBranch(BOOK_FLIGHT_TOOLS, {
  toolsSection: BOOK_FLIGHT_TOOLS_SECTION,
  includeBookingRules: true,
  includeBookingContext: true,
});

export const bookHotelBranch = buildBranch(BOOK_HOTEL_TOOLS, {
  toolsSection: BOOK_HOTEL_TOOLS_SECTION,
  includeBookingRules: true,
  includeBookingContext: true,
});

export const cancelBookingBranch = buildBranch(CANCEL_BOOKING_TOOLS, {
  toolsSection: CANCEL_BOOKING_TOOLS_SECTION,
});

export const generalBranch = buildBranch(GENERAL_TOOLS, {
  toolsSection: GENERAL_SYSTEM_PROMPT_SUFFIX,
});
