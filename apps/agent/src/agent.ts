import { END, START, StateGraph } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

import { EXTERNAL_API_RETRY_POLICY, POSTGRES_URL } from './constants';
import {
  BRANCH_NAMES,
  bookFlightBranch,
  bookHotelBranch,
  cancelBookingBranch,
  classifyNode,
  exploreBranch,
  generalBranch,
  planBranch,
  saveMemoryNode,
} from './nodes';
import { GraphState } from './state';

export const buildGraph = () =>
  new StateGraph(GraphState)
    .addNode('classify', classifyNode, { ends: BRANCH_NAMES })
    .addNode('explore', exploreBranch, { retryPolicy: EXTERNAL_API_RETRY_POLICY })
    .addNode('plan', planBranch, { retryPolicy: EXTERNAL_API_RETRY_POLICY })
    .addNode('bookFlight', bookFlightBranch, { retryPolicy: EXTERNAL_API_RETRY_POLICY })
    .addNode('bookHotel', bookHotelBranch, { retryPolicy: EXTERNAL_API_RETRY_POLICY })
    .addNode('cancelBooking', cancelBookingBranch, { retryPolicy: EXTERNAL_API_RETRY_POLICY })
    .addNode('general', generalBranch)
    .addNode('saveMemory', saveMemoryNode)
    .addEdge(START, 'classify')
    .addEdge('explore', 'saveMemory')
    .addEdge('plan', 'saveMemory')
    .addEdge('bookFlight', 'saveMemory')
    .addEdge('bookHotel', 'saveMemory')
    .addEdge('cancelBooking', 'saveMemory')
    .addEdge('general', 'saveMemory')
    .addEdge('saveMemory', END);

export const graph = buildGraph().compile({
  checkpointer: PostgresSaver.fromConnString(POSTGRES_URL!),
});
