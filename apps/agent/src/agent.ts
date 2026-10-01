import { END, START, StateGraph } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

// Constants
import {
  BRANCH_NAMES,
  EXTERNAL_API_RETRY_POLICY,
  INFRASTRUCTURE_NODE_NAME,
  PERSIST_TRANSCRIPT_NODE_NAME,
  POSTGRES_URL,
  SUGGEST_NODE_NAME,
} from './constants';

// Nodes
import {
  SUPERVISOR_ROUTES,
  bookingAgent,
  classifyNode,
  exploreAgent,
  generalAgent,
  planningAgent,
  persistTranscriptNode,
  refusalNode,
  routeAfterSupervisor,
  routeFromStart,
  saveMemoryNode,
  suggestNode,
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
    .addNode(PERSIST_TRANSCRIPT_NODE_NAME, persistTranscriptNode)
    .addNode(SUGGEST_NODE_NAME, suggestNode)
    .addConditionalEdges(START, routeFromStart, [
      INFRASTRUCTURE_NODE_NAME.CLASSIFY,
      SUGGEST_NODE_NAME,
    ])
    .addEdge('explore', 'supervise')
    .addEdge('plan', 'supervise')
    .addEdge('booking', 'supervise')
    .addEdge('general', 'supervise')
    .addEdge('refusal', PERSIST_TRANSCRIPT_NODE_NAME)
    .addConditionalEdges('supervise', routeAfterSupervisor, SUPERVISOR_ROUTES)
    .addEdge('saveMemory', PERSIST_TRANSCRIPT_NODE_NAME)
    .addEdge(PERSIST_TRANSCRIPT_NODE_NAME, END)
    .addEdge(SUGGEST_NODE_NAME, END);

export const graph = buildGraph().compile({
  checkpointer: PostgresSaver.fromConnString(POSTGRES_URL!),
});
