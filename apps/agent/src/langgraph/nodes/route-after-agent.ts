import { isAIMessage } from '@langchain/core/messages';
import { END } from '@langchain/langgraph';

import type { GraphStateType } from '../state';
import { tools } from '../tools';

const LOCAL_TOOL_NAMES = new Set<string>(tools.map((tool) => tool.name));

/**
 * Replaces the prebuilt `toolsCondition`, which only checks whether *any*
 * tool call is present. This also checks *which* tool: calls matching a
 * local backend tool route to `toolExecutor` for ToolNode dispatch; calls for
 * frontend-only CopilotKit actions (HITL gates, client actions) route to
 * `END` so the AG-UI/LangGraph bridge can surface them as interrupts instead
 * of erroring inside ToolNode, which only knows the local tools array.
 */
export const routeAfterAgent = (state: GraphStateType): 'toolExecutor' | typeof END => {
  const lastMessage = state.messages.at(-1);
  if (!lastMessage || !isAIMessage(lastMessage) || !lastMessage.tool_calls?.length) return END;

  const allLocal = lastMessage.tool_calls.every((call) => LOCAL_TOOL_NAMES.has(call.name));
  return allLocal ? 'toolExecutor' : END;
};
