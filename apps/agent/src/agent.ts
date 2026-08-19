import { END, START, StateGraph } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

// Constants
import { BRANCH_NAMES, EXTERNAL_API_RETRY_POLICY, POSTGRES_URL } from './constants';

// Nodes
import {
  SUPERVISOR_ROUTES,
  bookingAgent,
  classifyNode,
  exploreAgent,
  generalAgent,
  planningAgent,
  refusalNode,
  routeAfterSupervisor,
  saveMemoryNode,
  supervisorNode,
} from './nodes';

// State
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
    .addNode('booking', bookingAgent)
    .addNode('general', generalAgent)
    .addNode('refusal', refusalNode)
    .addNode('supervise', supervisorNode)
    .addNode('saveMemory', saveMemoryNode)
    .addEdge(START, 'classify')
    .addEdge('explore', 'supervise')
    .addEdge('plan', 'supervise')
    .addEdge('booking', 'supervise')
    .addEdge('general', 'supervise')
    .addEdge('refusal', END)
    .addConditionalEdges('supervise', routeAfterSupervisor, SUPERVISOR_ROUTES)
    .addEdge('saveMemory', END);

export const graph = buildGraph().compile({
  checkpointer: PostgresSaver.fromConnString(POSTGRES_URL!),
});
