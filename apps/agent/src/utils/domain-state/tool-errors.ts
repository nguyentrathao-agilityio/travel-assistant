import type { ToolMessage } from '@langchain/core/messages';
import type { z } from 'zod';

// Constants
import { WRITE_AGENT_NODE_NAMES, type DomainAgentNodeName } from '@/constants';

// Schemas
import { ToolErrorSchema } from '@/schemas';

// State
import type { GraphError } from '@/state';

const WRITE_TASKS = new Set<DomainAgentNodeName>(WRITE_AGENT_NODE_NAMES);

const graphErrorCode = (
  taskName: DomainAgentNodeName,
  code: z.infer<typeof ToolErrorSchema>['code']
): GraphError['code'] => {
  if (WRITE_TASKS.has(taskName) && code === 'TIMEOUT') return 'WRITE_STATUS_UNKNOWN';
  if (code === 'VALIDATION_ERROR') return 'VALIDATION_ERROR';
  if (code === 'TIMEOUT') return 'TIMEOUT';
  if (code === 'RATE_LIMITED') return 'RATE_LIMIT';

  return 'PROVIDER_ERROR';
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
    operation: message.name ?? 'unknownTool',
    provider: parsed.data.provider,
    code: graphErrorCode(taskName, parsed.data.code),
    message:
      isWrite && parsed.data.code === 'TIMEOUT'
        ? 'The provider may have received the write request. Verify the booking status before trying again.'
        : parsed.data.message,
    retryable: isWrite ? false : parsed.data.retryable,
  };
};
