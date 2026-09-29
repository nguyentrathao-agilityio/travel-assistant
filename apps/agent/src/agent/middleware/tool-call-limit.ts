import { toolCallLimitMiddleware } from 'langchain';

// Constants
import { TOOL_CALL_RUN_LIMIT } from '@/constants';

// Blocks tool calls past the per-turn cap so a flaky tool cannot loop the agent forever.
export const createToolCallLimitMiddleware = () =>
  toolCallLimitMiddleware({ runLimit: TOOL_CALL_RUN_LIMIT, exitBehavior: 'end' });
