import { z } from 'zod';

// Schemas
import { PlanningOperationSchema } from '@/schemas/intent';

export const GraphErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'MISSING_INPUT',
  'NOT_FOUND',
  'TIMEOUT',
  'RATE_LIMIT',
  'PROVIDER_ERROR',
  'MAX_RETRY_EXCEEDED',
  'WRITE_STATUS_UNKNOWN',
]);

export const GraphErrorSchema = z.object({
  node: z.string().optional(),
  operation: z.string().optional(),
  provider: z.string().optional(),
  message: z.string(),
  code: GraphErrorCodeSchema.default('PROVIDER_ERROR'),
  retryable: z.boolean().default(false),
  occurredAt: z.string().optional(),
});
export type GraphError = z.infer<typeof GraphErrorSchema>;

export const ExecutionStateObjectSchema = z.object({
  currentNode: z.string().optional(),
  completedTasks: z.array(z.string()).default(() => []),
  missingFields: z.array(z.string()).default(() => []),
  errors: z.array(GraphErrorSchema).default(() => []),
  retryCount: z.record(z.number().int().nonnegative()).default(() => ({})),
  requiredOperations: z.array(PlanningOperationSchema).default(() => []),
});
export const ExecutionStateSchema = ExecutionStateObjectSchema.default(() => ({
  completedTasks: [],
  missingFields: [],
  errors: [],
  retryCount: {},
  requiredOperations: [],
}));
export type ExecutionState = z.infer<typeof ExecutionStateSchema>;

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
