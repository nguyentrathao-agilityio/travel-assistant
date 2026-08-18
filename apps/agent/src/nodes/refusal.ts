import { AIMessage } from '@langchain/core/messages';

// Constants
import { INFRASTRUCTURE_NODE_NAME } from '@/constants';

// State
import type { GraphStateType, GraphStateUpdate } from '@/state';

const DEFAULT_OUT_OF_SCOPE_RESPONSE =
  'I can only help with travel planning. Is there a trip I can help you with?';

/**
 * Returns a scope refusal without invoking a model, tool, supervisor, or memory extraction.
 * Uses the language-matched refusalMessage classifyNode already produced in the same LLM call;
 * falls back to a fixed English reply only if that field is missing.
 */
export const refusalNode = (state: GraphStateType): GraphStateUpdate => ({
  messages: [new AIMessage(state.refusalMessage ?? DEFAULT_OUT_OF_SCOPE_RESPONSE)],
  execution: {
    currentNode: INFRASTRUCTURE_NODE_NAME.REFUSAL,
    completedTasks: [INFRASTRUCTURE_NODE_NAME.REFUSAL],
  },
});
