import type { ToolMessage } from '@langchain/core/messages';
import type { z } from 'zod';

// Constants
import { UNKNOWN_TOOL_NAME, WRITE_AGENT_NODE_NAMES, type DomainAgentNodeName } from '@/constants';

// Schemas
import { TOOL_ERROR_CODES, ToolErrorSchema } from '@/schemas';

// State
import { GRAPH_ERROR_CODE_BY_TOOL_ERROR_CODE, GRAPH_ERROR_CODES, type GraphError } from '@/state';

const WRITE_TASKS = new Set<DomainAgentNodeName>(WRITE_AGENT_NODE_NAMES);

const graphErrorCode = (
  taskName: DomainAgentNodeName,
  code: z.infer<typeof ToolErrorSchema>['code']
): GraphError['code'] => {
  if (WRITE_TASKS.has(taskName) && code === TOOL_ERROR_CODES.TIMEOUT) {
    return GRAPH_ERROR_CODES.WRITE_STATUS_UNKNOWN;
  }

  return GRAPH_ERROR_CODE_BY_TOOL_ERROR_CODE[code] ?? GRAPH_ERROR_CODES.PROVIDER_ERROR;
};

/** Maps a validated provider/tool error into the graph-owned recovery model. */
export const graphErrorFromTool = (
  taskName: DomainAgentNodeName,
  message: ToolMessage
): GraphError | undefined => {
  const parsed = ToolErrorSchema.safeParse(message.artifact);

  if (!parsed.success) return undefined;

  const isWrite = WRITE_TASKS.has(taskName);

  return {
    node: taskName,
    operation: message.name ?? UNKNOWN_TOOL_NAME,
    provider: parsed.data.provider,
    code: graphErrorCode(taskName, parsed.data.code),
    message:
      isWrite && parsed.data.code === TOOL_ERROR_CODES.TIMEOUT
        ? 'The provider may have received the write request. Verify the booking status before trying again.'
        : parsed.data.message,
    retryable: isWrite ? false : parsed.data.retryable,
  };
};
