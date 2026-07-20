import { StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';

// State
import { GraphState } from './state';

// Nodes
import { createCallModelNode, routeAfterAgent } from './nodes';

// Tools
import { tools } from './tools';

// LLM
import { createChatModel } from './llm';

// Constants
import { OPENAI_API_KEY } from './constants';

export const graph = new StateGraph(GraphState)
  .addNode('agent', createCallModelNode(createChatModel({ apiKey: OPENAI_API_KEY! })))
  .addNode('toolExecutor', new ToolNode(tools))
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', routeAfterAgent, ['toolExecutor', END])
  .addEdge('toolExecutor', 'agent')
  .compile();
