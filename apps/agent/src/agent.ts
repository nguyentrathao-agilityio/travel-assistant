import { END, START, StateGraph } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

import { EXTERNAL_API_RETRY_POLICY, POSTGRES_URL } from './constants';
import {
  cancelBookingAgent,
  exploreAgent,
  flightBookingAgent,
  generalAgent,
  hotelBookingAgent,
  planningAgent,
} from './agents';
import { BRANCH_NAMES, classifyNode, routeAfterPlanning, saveMemoryNode } from './nodes';
import { GraphState } from './state';

export const buildGraph = () =>
  new StateGraph(GraphState)
    .addNode('classify', classifyNode, {
      ends: BRANCH_NAMES,
      retryPolicy: EXTERNAL_API_RETRY_POLICY,
    })
    .addNode('explore', exploreAgent, { retryPolicy: EXTERNAL_API_RETRY_POLICY })
    .addNode('plan', planningAgent, {
      retryPolicy: EXTERNAL_API_RETRY_POLICY,
    })
    .addNode('bookFlight', flightBookingAgent)
    .addNode('bookHotel', hotelBookingAgent)
    .addNode('cancelBooking', cancelBookingAgent)
    .addNode('general', generalAgent)
    .addNode('saveMemory', saveMemoryNode)
    .addEdge(START, 'classify')
    .addEdge('explore', 'saveMemory')
    .addConditionalEdges('plan', routeAfterPlanning, ['bookFlight', 'bookHotel', 'saveMemory'])
    .addEdge('bookFlight', 'saveMemory')
    .addEdge('bookHotel', 'saveMemory')
    .addEdge('cancelBooking', 'saveMemory')
    .addEdge('general', 'saveMemory')
    .addEdge('saveMemory', END);

export const graph = buildGraph().compile({
  checkpointer: PostgresSaver.fromConnString(POSTGRES_URL!),
});
