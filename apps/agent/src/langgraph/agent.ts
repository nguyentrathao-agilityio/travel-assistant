import { StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';

// State
import { GraphState } from './state';

// Nodes
import { createCallModelNode } from './nodes';

// Tools
import { weatherTools } from './tools';

// LLM
import { createChatModel } from './llm';

// Constants
import { OPENAI_API_KEY } from './constants';

export const graph = new StateGraph(GraphState)
  .addNode('agent', createCallModelNode(createChatModel({ apiKey: OPENAI_API_KEY! })))
  .addNode('tools', new ToolNode(weatherTools))
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', toolsCondition, ['tools', END])
  .addEdge('tools', 'agent')
  .compile();
