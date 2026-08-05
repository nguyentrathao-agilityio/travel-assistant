import { ToolMessage } from '@langchain/core/messages';
import type { RunnableConfig } from '@langchain/core/runnables';

// Schemas
import { ToolErrorSchema } from '@/schemas';

// Constants
import { MAX_RETRIES_PER_NODE, TOOL_NAMES } from '@/constants';

// State
import type { GraphError, GraphStateType, GraphStateUpdate, SupervisorState } from '@/state';

export type SupervisorRoute = NonNullable<SupervisorState['nextNode']>;
export const SUPERVISOR_ROUTES: SupervisorRoute[] = [
  'explore',
  'plan',
  'bookFlight',
  'bookHotel',
  'cancelBooking',
  'general',
  'saveMemory',
];

type DomainNode = Exclude<SupervisorRoute, 'saveMemory'>;
type ValidationResult = {
  status: SupervisorState['status'];
  reason: string;
  missingFields?: string[];
  retryable?: boolean;
  nextNode?: SupervisorRoute;
  error?: GraphError;
};

const isErrorArtifact = (artifact: unknown): boolean =>
  typeof artifact === 'object' && artifact !== null && 'error' in artifact;

const latestTurnToolMessages = (state: GraphStateType): ToolMessage[] => {
  let cutoff = state.messages.length - 1;
  while (cutoff >= 0 && state.messages[cutoff].getType() !== 'human') cutoff -= 1;
  return state.messages
    .slice(cutoff + 1)
    .filter((message): message is ToolMessage => message instanceof ToolMessage);
};

const latestResultPerTool = (state: GraphStateType): ToolMessage[] => {
  const seen = new Set<string>();
  const latest: ToolMessage[] = [];
  const messages = latestTurnToolMessages(state);
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const name = message.name ?? 'unknownTool';
    if (seen.has(name)) continue;
    seen.add(name);
    latest.push(message);
  }
  return latest;
};

type ToolFailure = { name: string; error: GraphError };

const toolFailures = (state: GraphStateType): ToolFailure[] =>
  latestResultPerTool(state).flatMap((message): ToolFailure[] => {
    if (message.status !== 'error' && !isErrorArtifact(message.artifact)) return [];
    const name = message.name ?? 'unknownTool';
    const parsed = ToolErrorSchema.safeParse(message.artifact);
    if (!parsed.success) {
      const retryable =
        state.execution.currentNode === 'explore' || state.execution.currentNode === 'plan';
      return [
        {
          name,
          error: {
            node: state.execution.currentNode,
            operation: name,
            code: 'PROVIDER_ERROR',
            message: 'The provider operation failed.',
            retryable,
          },
        },
      ];
    }
    const code: GraphError['code'] =
      parsed.data.code === 'TIMEOUT'
        ? 'TIMEOUT'
        : parsed.data.code === 'RATE_LIMITED'
          ? 'RATE_LIMIT'
          : parsed.data.code === 'VALIDATION_ERROR'
            ? 'VALIDATION_ERROR'
            : 'PROVIDER_ERROR';
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

const failureValidation = (state: GraphStateType, label: string): ValidationResult | undefined => {
  const failures = toolFailures(state);
  if (failures.length === 0) return undefined;
  const retryable = failures.every(({ error }) => error.retryable);
  return {
    status: 'failed',
    reason: `${label} failed: ${failures.map(({ name }) => name).join(', ')}`,
    retryable,
    error: failures[0].error,
  };
};

const requestDestination = (state: GraphStateType): string | undefined =>
  state.request.destination ?? state.destination;

const missingRequiredOperations = (state: GraphStateType): string[] => {
  const results = state.searchResults;
  const toolNames = new Set(latestTurnToolMessages(state).map(({ name }) => name));
  return (state.execution.requiredOperations ?? []).filter((operation) => {
    if (operation === 'weather') return results.weather === undefined;
    if (operation === 'flights') return results.flights === undefined;
    if (operation === 'hotels') return results.hotels === undefined;
    if (operation === 'places') return results.places === undefined;
    if (operation === 'route') return results.route === undefined;
    if (operation === 'tripSummary') return !toolNames.has(TOOL_NAMES.TRIP_SUMMARY);
    return !toolNames.has(TOOL_NAMES.KNOWLEDGE_SEARCH);
  });
};

// Retryable only with partial progress; zero fulfilled means the agent asked the user instead of
// calling a tool, and retrying would just repeat the same question.
const missingOperationsResult = (
  state: GraphStateType,
  missingOperations: string[],
  reason: string
): ValidationResult => {
  const requiredOperations = state.execution.requiredOperations ?? [];
  const madeProgress = missingOperations.length < requiredOperations.length;
  return madeProgress
    ? { status: 'incomplete', reason, retryable: true }
    : { status: 'incomplete', reason, missingFields: missingOperations };
};

export const validateExploreResult = (state: GraphStateType): ValidationResult => {
  const failure = failureValidation(state, 'Explore tool execution');
  if (failure) return failure;

  if (!requestDestination(state) && latestTurnToolMessages(state).length === 0) {
    return {
      status: 'incomplete',
      reason: 'A destination is required before destination exploration can continue.',
      missingFields: ['destination'],
    };
  }

  const missingOperations = missingRequiredOperations(state);
  if (missingOperations.length > 0) {
    return missingOperationsResult(
      state,
      missingOperations,
      `Exploration still needs: ${missingOperations.join(', ')}.`
    );
  }

  const hasResult = Boolean(
    state.searchResults.weather ||
    state.searchResults.places ||
    state.searchResults.localTips ||
    latestTurnToolMessages(state).some(({ name }) => name === TOOL_NAMES.KNOWLEDGE_SEARCH)
  );
  return hasResult
    ? { status: 'complete', reason: 'Explore result is available.' }
    : {
        status: 'incomplete',
        reason: 'Explore completed without a structured result.',
        retryable: true,
      };
};

export const validatePlanningResult = (state: GraphStateType): ValidationResult => {
  if (state.handoffTarget) {
    return {
      status: 'complete',
      reason: `Planning requested the ${state.handoffTarget} handoff.`,
      nextNode: state.handoffTarget,
    };
  }

  const failure = failureValidation(state, 'Planning tool execution');
  if (failure) return failure;

  if (!requestDestination(state) && latestTurnToolMessages(state).length === 0) {
    return {
      status: 'incomplete',
      reason: 'A destination is required before planning can continue.',
      missingFields: ['destination'],
    };
  }

  const missingOperations = missingRequiredOperations(state);
  if (missingOperations.length > 0) {
    return missingOperationsResult(
      state,
      missingOperations,
      `Planning still needs: ${missingOperations.join(', ')}.`
    );
  }

  const results = state.searchResults;
  const latestToolNames = new Set(latestTurnToolMessages(state).map(({ name }) => name));
  // tripSummaryTool only lands in searchResults.route when the summary includes a route.
  const hasResult = Boolean(
    results.weather ||
    results.flights ||
    results.hotels ||
    results.places ||
    results.route ||
    latestToolNames.has(TOOL_NAMES.KNOWLEDGE_SEARCH) ||
    latestToolNames.has(TOOL_NAMES.TRIP_SUMMARY)
  );
  return hasResult
    ? {
        status: 'complete',
        reason:
          results.hotels?.results.length === 0
            ? 'Hotel search completed with no matching results.'
            : 'Planning result is available.',
      }
    : {
        status: 'incomplete',
        reason: 'Planning completed without a structured result.',
        retryable: true,
      };
};

const validateBookingResult = (
  state: GraphStateType,
  type: 'flight' | 'hotel'
): ValidationResult => {
  const failure = failureValidation(state, `${type} booking`);
  if (failure) {
    return {
      status: 'failed',
      reason:
        failure.error?.code === 'TIMEOUT'
          ? `The ${type} booking status is unknown and must be verified before retrying.`
          : failure.reason,
      error:
        failure.error?.code === 'TIMEOUT'
          ? { ...failure.error, code: 'WRITE_STATUS_UNKNOWN', retryable: false }
          : { ...failure.error!, retryable: false },
    };
  }

  const isBooked =
    type === 'flight'
      ? state.flightSelectionStatus === 'booked'
      : state.hotelSelectionStatus === 'booked';
  const hasDraft =
    type === 'flight'
      ? Boolean(state.selectedOptions.flightId || state.flights?.departure?.id)
      : Boolean(state.selectedOptions.hotelId || state.hotel?.id);

  if (isBooked) return { status: 'complete', reason: `${type} booking is confirmed.` };
  if (hasDraft) {
    return {
      status: 'incomplete',
      reason: `${type} booking remains a draft or requires user input/approval.`,
    };
  }
  return {
    status: 'incomplete',
    reason: `${type} booking requires an exact selected option.`,
    missingFields: [type === 'flight' ? 'flightId' : 'hotelId'],
  };
};

export const validateFlightResult = (state: GraphStateType): ValidationResult =>
  validateBookingResult(state, 'flight');

export const validateHotelResult = (state: GraphStateType): ValidationResult =>
  validateBookingResult(state, 'hotel');

export const validateCancellationResult = (state: GraphStateType): ValidationResult => {
  const failure = failureValidation(state, 'Cancellation');
  return failure
    ? {
        status: 'failed',
        reason:
          failure.error?.code === 'TIMEOUT'
            ? 'The cancellation status is unknown and must be verified before retrying.'
            : failure.reason,
        error:
          failure.error?.code === 'TIMEOUT'
            ? { ...failure.error, code: 'WRITE_STATUS_UNKNOWN', retryable: false }
            : { ...failure.error!, retryable: false },
      }
    : {
        status: latestTurnToolMessages(state).length > 0 ? 'complete' : 'incomplete',
        reason:
          latestTurnToolMessages(state).length > 0
            ? 'Cancellation interaction completed.'
            : 'Cancellation requires a booking identifier or user confirmation.',
      };
};

const validatorFor = (node: DomainNode, state: GraphStateType): ValidationResult => {
  if (node === 'explore') return validateExploreResult(state);
  if (node === 'plan') return validatePlanningResult(state);
  if (node === 'bookFlight') return validateFlightResult(state);
  if (node === 'bookHotel') return validateHotelResult(state);
  if (node === 'cancelBooking') return validateCancellationResult(state);
  return { status: 'complete', reason: 'General response completed.' };
};

const isDomainNode = (value: string | undefined): value is DomainNode =>
  value !== undefined &&
  SUPERVISOR_ROUTES.includes(value as SupervisorRoute) &&
  value !== 'saveMemory';

const traceRecovery = (
  config: RunnableConfig | undefined,
  node: string,
  error: GraphError,
  retryCount: number
): void => {
  console.warn('[graph-recovery]', {
    node,
    tool: error.operation,
    provider: error.provider,
    retryCount,
    threadId: config?.configurable?.thread_id,
    operationId: config?.runId,
    errorCode: error.code,
  });
};

export const supervisorNode = (
  state: GraphStateType,
  config?: RunnableConfig
): GraphStateUpdate => {
  const node = state.execution.currentNode;
  if (!isDomainNode(node)) {
    return {
      supervisor: {
        status: 'failed',
        nextNode: 'saveMemory',
        reason: `Unknown supervisor source node: ${node ?? 'missing'}.`,
      },
      execution: {
        missingFields: [],
        errors: [
          {
            node: 'supervisor',
            code: 'PROVIDER_ERROR',
            message: 'Unknown supervisor source node.',
            retryable: false,
          },
        ],
      },
    };
  }

  const validation = validatorFor(node, state);
  if (validation.nextNode) {
    return {
      supervisor: { ...validation, nextNode: validation.nextNode },
      execution: { missingFields: validation.missingFields ?? [], retryCount: { [node]: 0 } },
    };
  }

  const retries = state.execution.retryCount[node] ?? 0;
  if (validation.error) traceRecovery(config, node, validation.error, retries);
  if (validation.retryable && (node === 'explore' || node === 'plan')) {
    if (retries < MAX_RETRIES_PER_NODE) {
      return {
        supervisor: {
          status: validation.status,
          nextNode: node,
          reason: `${validation.reason} Retry ${retries + 1}/${MAX_RETRIES_PER_NODE}.`,
        },
        execution: {
          missingFields: validation.missingFields ?? [],
          retryCount: { [node]: retries + 1 },
        },
      };
    }

    return {
      supervisor: {
        status: 'failed',
        nextNode: 'saveMemory',
        reason: `${validation.reason} Maximum retries reached.`,
      },
      execution: {
        missingFields: validation.missingFields ?? [],
        errors: [
          { node, code: 'MAX_RETRY_EXCEEDED', message: validation.reason, retryable: false },
        ],
      },
    };
  }

  return {
    supervisor: { status: validation.status, nextNode: 'saveMemory', reason: validation.reason },
    execution: {
      missingFields: validation.missingFields ?? [],
      errors: validation.missingFields?.length
        ? [
            {
              node,
              operation: 'collect_input',
              code: 'MISSING_INPUT',
              message: validation.reason,
              retryable: false,
            },
          ]
        : validation.error
          ? [validation.error]
          : undefined,
      retryCount: validation.status === 'complete' ? { [node]: 0 } : undefined,
    },
  };
};

export const routeAfterSupervisor = (state: GraphStateType): SupervisorRoute => {
  const route = state.supervisor.nextNode;
  return route && SUPERVISOR_ROUTES.includes(route) ? route : 'saveMemory';
};
