// Constants
import { RETRYABLE_DOMAIN_NODE_NAMES } from '@/constants';

// Schemas
import { ToolErrorSchema } from '@/schemas';

// State
import {
  GRAPH_ERROR_CODE_BY_TOOL_ERROR_CODE,
  GRAPH_ERROR_CODES,
  SUPERVISOR_STATUSES,
  type GraphError,
  type GraphStateType,
  type ValidationResult,
} from '@/state';

// Utils
import { isErrorArtifact } from '../artifact';
import { isIntentionalBookingRejection, latestResultPerTool } from './tool-messages';

type ToolFailure = { name: string; error: GraphError };

/** Extracts a structured error for each failed tool call in the current turn. */
const toolFailures = (state: GraphStateType): ToolFailure[] =>
  latestResultPerTool(state.messages).flatMap((message): ToolFailure[] => {
    if (isIntentionalBookingRejection(message)) return [];

    // Convert both structured and legacy failures into one graph error contract.
    if (message.status !== 'error' && !isErrorArtifact(message.artifact)) return [];
    const name = message.name ?? 'unknownTool';
    const parsed = ToolErrorSchema.safeParse(message.artifact);

    if (!parsed.success) {
      const retryable = RETRYABLE_DOMAIN_NODE_NAMES.has(state.execution.currentNode ?? '');

      return [
        {
          name,
          error: {
            node: state.execution.currentNode,
            operation: name,
            code: GRAPH_ERROR_CODES.PROVIDER_ERROR,
            message: 'The provider operation failed.',
            retryable,
          },
        },
      ];
    }

    const code: GraphError['code'] =
      GRAPH_ERROR_CODE_BY_TOOL_ERROR_CODE[parsed.data.code] ?? GRAPH_ERROR_CODES.PROVIDER_ERROR;

    return [
      {
        name,
        error: {
          node: state.execution.currentNode,
          operation: name,
          provider: parsed.data.provider,
          code,
          message: parsed.data.message,
          retryable: parsed.data.retryable,
        },
      },
    ];
  });

/** Checks the current turn's tool calls for failures and summarizes them as a validation result. */
export const failureValidation = (
  state: GraphStateType,
  label: string
): ValidationResult | undefined => {
  // Aggregate current-turn failures into the supervisor's retry decision.
  const failures = toolFailures(state);

  if (failures.length === 0) return undefined;
  const retryable = failures.every(({ error }) => error.retryable);

  return {
    status: SUPERVISOR_STATUSES.FAILED,
    reason: `${label} failed: ${failures.map(({ name }) => name).join(', ')}`,
    retryable,
    error: failures[0].error,
  };
};

/** Failed writes with an unknown outcome (e.g. a timeout) must be verified, never blindly retried. */
export const writeFailureResult = (failure: ValidationResult, label: string): ValidationResult => {
  // Convert ambiguous write timeouts into verification-required terminal failures.
  const isUnknownOutcome = failure.error?.code === GRAPH_ERROR_CODES.TIMEOUT;

  return {
    status: SUPERVISOR_STATUSES.FAILED,
    reason: isUnknownOutcome
      ? `The ${label} status is unknown and must be verified before retrying.`
      : failure.reason,
    error: isUnknownOutcome
      ? { ...failure.error!, code: GRAPH_ERROR_CODES.WRITE_STATUS_UNKNOWN, retryable: false }
      : { ...failure.error!, retryable: false },
  };
};
