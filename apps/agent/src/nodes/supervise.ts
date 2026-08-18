import type { RunnableConfig } from '@langchain/core/runnables';

// Constants
import {
  BOOKING_OPERATIONS,
  BOOKING_STATUSES,
  BOOKING_TYPES,
  DOMAIN_NODE_NAME,
  FINALIZATION_NODE_NAME,
  INFRASTRUCTURE_NODE_NAME,
  MAX_RETRIES_PER_NODE,
  RETRYABLE_DOMAIN_NODE_NAMES,
  TOOL_NAMES,
  type BookingType,
  type BookingOperation,
  type DomainAgentNodeName,
} from '@/constants';

// Utils
import { failureValidation, writeFailureResult } from '@/utils/domain-state/tool-failures';
import {
  isIntentionalBookingRejection,
  latestTurnToolMessages as latestTurnToolMessagesFromList,
} from '@/utils/domain-state/tool-messages';
import {
  missingOperationsResult,
  missingRequiredOperations,
} from '@/utils/domain-state/required-operations';

// Schemas
import { BookingSchema } from '@/schemas/booking';

// State
import {
  GRAPH_ERROR_CODES,
  SELECTION_STATUSES,
  SUPERVISOR_NEXT_NODE_NAMES,
  SUPERVISOR_STATUSES,
  type GraphError,
  type GraphStateType,
  type GraphStateUpdate,
  type SupervisorRoute,
  type ValidationResult,
} from '@/state';

export type { SupervisorRoute };
export const SUPERVISOR_ROUTES: SupervisorRoute[] = [...SUPERVISOR_NEXT_NODE_NAMES];

type DomainNode = DomainAgentNodeName;

/** Tool messages produced since the user's latest message. */
const latestTurnToolMessages = (state: GraphStateType) =>
  latestTurnToolMessagesFromList(state.messages);

/** The destination for this request, from client input or already-resolved trip state. */
const requestDestination = (state: GraphStateType): string | undefined =>
  state.request.destination ?? state.destination;

/**
 * Shared precondition checks for the explore/plan validators: tool failures, then a missing
 * destination, then missing required operations. Returns `undefined` when the turn may proceed.
 */
const searchPreconditionFailure = (
  state: GraphStateType,
  labels: { failureLabel: string; destinationReason: string; operationsLabel: string }
): ValidationResult | undefined => {
  // Stop on provider failures before evaluating request completeness.
  const failure = failureValidation(state, labels.failureLabel);

  if (failure) return failure;

  if (!requestDestination(state) && latestTurnToolMessages(state).length === 0) {
    return {
      status: SUPERVISOR_STATUSES.INCOMPLETE,
      reason: labels.destinationReason,
      missingFields: ['destination'],
    };
  }

  // Report any domain operations that still need to run.
  const missingOperations = missingRequiredOperations(state);

  if (missingOperations.length > 0) {
    return missingOperationsResult(
      state,
      missingOperations,
      `${labels.operationsLabel} still needs: ${missingOperations.join(', ')}.`
    );
  }

  return undefined;
};

/** Checks the explore agent's turn for tool failures, missing required data, or a usable result. */
export const validateExploreResult = (state: GraphStateType): ValidationResult => {
  const precondition = searchPreconditionFailure(state, {
    failureLabel: 'Explore tool execution',
    destinationReason: 'A destination is required before destination exploration can continue.',
    operationsLabel: 'Exploration',
  });

  if (precondition) return precondition;

  const hasResult = Boolean(
    state.searchResults.weather ||
    state.searchResults.places ||
    state.searchResults.localTips ||
    latestTurnToolMessages(state).some(({ name }) => name === TOOL_NAMES.KNOWLEDGE_SEARCH)
  );

  return hasResult
    ? { status: SUPERVISOR_STATUSES.COMPLETE, reason: 'Explore result is available.' }
    : {
        status: SUPERVISOR_STATUSES.INCOMPLETE,
        reason: 'Explore completed without a structured result.',
        retryable: true,
      };
};

/**
 * Checks the planning agent's turn for a booking handoff request, tool failures, missing
 * required data, or a usable result.
 */
export const validatePlanningResult = (state: GraphStateType): ValidationResult => {
  // Honor an explicit booking handoff before assessing ordinary planning output.
  if (state.handoffTarget) {
    return {
      status: SUPERVISOR_STATUSES.COMPLETE,
      reason: `Planning requested the ${state.handoffTarget} handoff.`,
      nextNode: state.handoffTarget,
    };
  }

  const precondition = searchPreconditionFailure(state, {
    failureLabel: 'Planning tool execution',
    destinationReason: 'A destination is required before planning can continue.',
    operationsLabel: 'Planning',
  });

  if (precondition) return precondition;

  // Accept either persisted search artifacts or tools whose output is intentionally transient.
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
        status: SUPERVISOR_STATUSES.COMPLETE,
        reason:
          results.hotels?.results.length === 0
            ? 'Hotel search completed with no matching results.'
            : 'Planning result is available.',
      }
    : {
        status: SUPERVISOR_STATUSES.INCOMPLETE,
        reason: 'Planning completed without a structured result.',
        retryable: true,
      };
};

/** Per-booking-type reads of confirmation/draft state, keyed by `BOOKING_TYPES`. */
const BOOKING_STATE_ACCESSORS: Record<
  BookingType,
  {
    isBooked: (state: GraphStateType) => boolean;
    hasDraft: (state: GraphStateType) => boolean;
    missingField: string;
  }
> = {
  [BOOKING_TYPES.FLIGHT]: {
    isBooked: (state) => state.flightSelectionStatus === SELECTION_STATUSES.BOOKED,
    hasDraft: (state) => Boolean(state.selectedOptions.flightId || state.flights?.departure?.id),
    missingField: 'flightId',
  },
  [BOOKING_TYPES.HOTEL]: {
    isBooked: (state) => state.hotelSelectionStatus === SELECTION_STATUSES.BOOKED,
    hasDraft: (state) => Boolean(state.selectedOptions.hotelId || state.hotel?.id),
    missingField: 'hotelId',
  },
};

/** Checks a flight/hotel booking's turn for write failures, confirmation, or a draft selection. */
const validateBookingResult = (state: GraphStateType, type: BookingType): ValidationResult => {
  const failure = failureValidation(state, `${type} booking`);

  if (failure) return writeFailureResult(failure, `${type} booking`);

  const { isBooked, hasDraft, missingField } = BOOKING_STATE_ACCESSORS[type];

  if (isBooked(state)) {
    return { status: SUPERVISOR_STATUSES.COMPLETE, reason: `${type} booking is confirmed.` };
  }
  if (hasDraft(state)) {
    return {
      status: SUPERVISOR_STATUSES.INCOMPLETE,
      reason: `${type} booking remains a draft or requires user input/approval.`,
    };
  }

  return {
    status: SUPERVISOR_STATUSES.INCOMPLETE,
    reason: `${type} booking requires an exact selected option.`,
    missingFields: [missingField],
  };
};

/** Checks whether the flight booking is confirmed, still a draft, or missing a selected option. */
export const validateFlightResult = (state: GraphStateType): ValidationResult =>
  validateBookingResult(state, BOOKING_TYPES.FLIGHT);

/** Checks whether the hotel booking is confirmed, still a draft, or missing a selected option. */
export const validateHotelResult = (state: GraphStateType): ValidationResult =>
  validateBookingResult(state, BOOKING_TYPES.HOTEL);

/** Checks a cancellation operation for a confirmed cancellation or a deliberate rejection. */
export const validateCancellationResult = (state: GraphStateType): ValidationResult => {
  const cancellationMessage = [...latestTurnToolMessages(state)]
    .reverse()
    .find(({ name }) => name === TOOL_NAMES.CANCEL_BOOKING);

  if (cancellationMessage && isIntentionalBookingRejection(cancellationMessage)) {
    return {
      status: SUPERVISOR_STATUSES.COMPLETE,
      reason: 'Cancellation was rejected by the user.',
    };
  }

  const failure = failureValidation(state, 'Cancellation');

  if (failure) return writeFailureResult(failure, 'cancellation');

  const booking = BookingSchema.safeParse(cancellationMessage?.artifact);

  if (booking.success && booking.data.status === BOOKING_STATUSES.CANCELLED) {
    return { status: SUPERVISOR_STATUSES.COMPLETE, reason: 'Cancellation is confirmed.' };
  }

  return {
    status: SUPERVISOR_STATUSES.INCOMPLETE,
    reason: 'Cancellation requires a confirmed cancellation result or user rejection.',
  };
};

/** Selects the validation rules for the operation assigned to the unified booking agent. */
export const validateUnifiedBookingResult = (state: GraphStateType): ValidationResult => {
  const validators: Record<BookingOperation, (value: GraphStateType) => ValidationResult> = {
    [BOOKING_OPERATIONS.FLIGHT]: validateFlightResult,
    [BOOKING_OPERATIONS.HOTEL]: validateHotelResult,
    [BOOKING_OPERATIONS.CANCEL]: validateCancellationResult,
  };
  const operation = state.bookingOperation;

  if (!operation) {
    return {
      status: SUPERVISOR_STATUSES.INCOMPLETE,
      reason: 'Booking requires an operation.',
      missingFields: ['bookingOperation'],
    };
  }

  return validators[operation](state);
};

/** Dispatch table from domain node to its validator. */
const VALIDATOR_BY_NODE: Record<DomainNode, (state: GraphStateType) => ValidationResult> = {
  [DOMAIN_NODE_NAME.EXPLORE]: validateExploreResult,
  [DOMAIN_NODE_NAME.PLAN]: validatePlanningResult,
  [DOMAIN_NODE_NAME.BOOKING]: validateUnifiedBookingResult,
  [DOMAIN_NODE_NAME.GENERAL]: () => ({
    status: SUPERVISOR_STATUSES.COMPLETE,
    reason: 'General response completed.',
  }),
};

/** Runs the validator registered for the given domain node. */
const validatorFor = (node: DomainNode, state: GraphStateType): ValidationResult =>
  VALIDATOR_BY_NODE[node](state);

/** Narrows the supervised node to a known domain node (excludes the `saveMemory` finalization node). */
const isDomainNode = (value: string | undefined): value is DomainNode =>
  value !== undefined &&
  SUPERVISOR_ROUTES.includes(value as SupervisorRoute) &&
  value !== FINALIZATION_NODE_NAME;

/** Logs a recoverable graph error for observability. */
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

/**
 * Validates the domain agent's output for the current node and decides the next branch:
 * retry the same node, hand off to a booking node, or finalize via `saveMemory`.
 */
export const supervisorNode = (
  state: GraphStateType,
  config?: RunnableConfig
): GraphStateUpdate => {
  // Reject invalid graph origins instead of routing unknown state back into the graph.
  const node = state.execution.currentNode;

  if (!isDomainNode(node)) {
    return {
      supervisor: {
        status: SUPERVISOR_STATUSES.FAILED,
        nextNode: FINALIZATION_NODE_NAME,
        reason: `Unknown supervisor source node: ${node ?? 'missing'}.`,
      },
      execution: {
        missingFields: [],
        errors: [
          {
            node: INFRASTRUCTURE_NODE_NAME.SUPERVISOR,
            code: GRAPH_ERROR_CODES.PROVIDER_ERROR,
            message: 'Unknown supervisor source node.',
            retryable: false,
          },
        ],
      },
    };
  }

  // Run the domain-specific validator and honor any explicit handoff first.
  const validation = validatorFor(node, state);

  if (validation.nextNode) {
    return {
      supervisor: { ...validation, nextNode: validation.nextNode },
      execution: { missingFields: validation.missingFields ?? [], retryCount: { [node]: 0 } },
    };
  }

  // Retry eligible read operations within the configured recovery budget.
  const retries = state.execution.retryCount[node] ?? 0;

  if (validation.error) traceRecovery(config, node, validation.error, retries);
  if (validation.retryable && RETRYABLE_DOMAIN_NODE_NAMES.has(node)) {
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
        status: SUPERVISOR_STATUSES.FAILED,
        nextNode: FINALIZATION_NODE_NAME,
        reason: `${validation.reason} Maximum retries reached.`,
      },
      execution: {
        missingFields: validation.missingFields ?? [],
        errors: [
          {
            node,
            code: GRAPH_ERROR_CODES.MAX_RETRY_EXCEEDED,
            message: validation.reason,
            retryable: false,
          },
        ],
      },
    };
  }

  // Finalize completed or non-retryable outcomes with their collected diagnostics.
  return {
    supervisor: {
      status: validation.status,
      nextNode: FINALIZATION_NODE_NAME,
      reason: validation.reason,
    },
    execution: {
      missingFields: validation.missingFields ?? [],
      errors: validation.missingFields?.length
        ? [
            {
              node,
              operation: 'collect_input',
              code: GRAPH_ERROR_CODES.MISSING_INPUT,
              message: validation.reason,
              retryable: false,
            },
          ]
        : validation.error
          ? [validation.error]
          : undefined,
      retryCount: validation.status === SUPERVISOR_STATUSES.COMPLETE ? { [node]: 0 } : undefined,
    },
  };
};

/** Reads the supervisor's decision off state, defaulting to `saveMemory` if unset/invalid. */
export const routeAfterSupervisor = (state: GraphStateType): SupervisorRoute => {
  const route = state.supervisor.nextNode;

  return route && SUPERVISOR_ROUTES.includes(route) ? route : FINALIZATION_NODE_NAME;
};
