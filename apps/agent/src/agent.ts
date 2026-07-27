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
    .addEdge(START, 'classify')
    .addEdge('explore', END)
    .addEdge('plan', END)
    .addEdge('bookFlight', END)
    .addEdge('bookHotel', END)
    .addEdge('cancelBooking', END)
    .addEdge('general', END);

export const graph = buildGraph().compile({
  checkpointer: PostgresSaver.fromConnString(POSTGRES_URL!),
});
