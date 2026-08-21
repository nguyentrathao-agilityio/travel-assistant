import { z } from 'zod';

// Schemas
import { PlanningOperationSchema, TOOL_ERROR_CODES, type ToolError } from '@/schemas';

export const GRAPH_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_INPUT: 'MISSING_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  MAX_RETRY_EXCEEDED: 'MAX_RETRY_EXCEEDED',
  WRITE_STATUS_UNKNOWN: 'WRITE_STATUS_UNKNOWN',
} as const;

const GraphErrorCodeSchema = z.enum([
  GRAPH_ERROR_CODES.VALIDATION_ERROR,
  GRAPH_ERROR_CODES.MISSING_INPUT,
  GRAPH_ERROR_CODES.NOT_FOUND,
  GRAPH_ERROR_CODES.TIMEOUT,
  GRAPH_ERROR_CODES.RATE_LIMIT,
  GRAPH_ERROR_CODES.PROVIDER_ERROR,
  GRAPH_ERROR_CODES.MAX_RETRY_EXCEEDED,
  GRAPH_ERROR_CODES.WRITE_STATUS_UNKNOWN,
]);

const GraphErrorSchema = z.object({
  node: z.string().optional(),
  operation: z.string().optional(),
  provider: z.string().optional(),
  message: z.string(),
  code: GraphErrorCodeSchema.default(GRAPH_ERROR_CODES.PROVIDER_ERROR),
  retryable: z.boolean().default(false),
  occurredAt: z.string().optional(),
});
export type GraphError = z.infer<typeof GraphErrorSchema>;

/** Translates a validated provider/tool error code into the graph's own recovery code. */
export const GRAPH_ERROR_CODE_BY_TOOL_ERROR_CODE: Partial<
  Record<ToolError['code'], GraphError['code']>
> = {
  [TOOL_ERROR_CODES.TIMEOUT]: GRAPH_ERROR_CODES.TIMEOUT,
  [TOOL_ERROR_CODES.RATE_LIMITED]: GRAPH_ERROR_CODES.RATE_LIMIT,
  [TOOL_ERROR_CODES.VALIDATION_ERROR]: GRAPH_ERROR_CODES.VALIDATION_ERROR,
};

const ExecutionStateObjectSchema = z.object({
  currentNode: z.string().optional(),
  completedTasks: z.array(z.string()).default(() => []),
  missingFields: z.array(z.string()).default(() => []),
  errors: z.array(GraphErrorSchema).default(() => []),
  retryCount: z.record(z.number().int().nonnegative()).default(() => ({})),
  requiredOperations: z.array(PlanningOperationSchema).default(() => []),
});
export const createDefaultExecutionState = () => ({
  completedTasks: [],
  missingFields: [],
  errors: [],
  retryCount: {},
  requiredOperations: [],
});

export const ExecutionStateSchema = ExecutionStateObjectSchema.default(createDefaultExecutionState);
type ExecutionState = z.infer<typeof ExecutionStateSchema>;

export const ExecutionUpdateSchema = ExecutionStateObjectSchema.partial();

export const mergeExecutionState = (
  current: ExecutionState,
  update: Partial<ExecutionState>
): ExecutionState => ({
  ...current,
  ...update,
  completedTasks: update.completedTasks
    ? [...new Set([...current.completedTasks, ...update.completedTasks])]
    : current.completedTasks,
  missingFields: update.missingFields ?? current.missingFields,
  errors: update.errors ? [...current.errors, ...update.errors] : current.errors,
  retryCount: update.retryCount
    ? { ...current.retryCount, ...update.retryCount }
    : current.retryCount,
  requiredOperations: update.requiredOperations ?? current.requiredOperations,
});
