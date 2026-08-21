// Constants
import { TOOL_NAMES } from '@repo/constants';

// Utils
import { latestTurnToolMessages } from './tool-messages';

// Schemas
import { PLANNING_OPERATIONS, type PlanningOperation } from '@/schemas';

// State
import { SUPERVISOR_STATUSES, type GraphStateType, type ValidationResult } from '@/state';

type OperationMissingCheck = (
  results: GraphStateType['searchResults'],
  toolNames: ReadonlySet<string | undefined>
) => boolean;

const IS_OPERATION_MISSING: Record<PlanningOperation, OperationMissingCheck> = {
  [PLANNING_OPERATIONS.WEATHER]: (results) => results.weather === undefined,
  [PLANNING_OPERATIONS.FLIGHTS]: (results) => results.flights === undefined,
  [PLANNING_OPERATIONS.HOTELS]: (results) => results.hotels === undefined,
  [PLANNING_OPERATIONS.PLACES]: (results) => results.places === undefined,
  [PLANNING_OPERATIONS.ROUTE]: (results) => results.route === undefined,
  [PLANNING_OPERATIONS.TRIP_SUMMARY]: (_results, toolNames) =>
    !toolNames.has(TOOL_NAMES.TRIP_SUMMARY),
  [PLANNING_OPERATIONS.KNOWLEDGE]: (_results, toolNames) =>
    !toolNames.has(TOOL_NAMES.KNOWLEDGE_SEARCH),
};

const TRIP_SUMMARY_OPERATIONS = new Set<PlanningOperation>([
  PLANNING_OPERATIONS.FLIGHTS,
  PLANNING_OPERATIONS.HOTELS,
  PLANNING_OPERATIONS.ROUTE,
  PLANNING_OPERATIONS.TRIP_SUMMARY,
]);

/** Returns the required planning operations that don't yet have a usable result this turn. */
export const missingRequiredOperations = (state: GraphStateType): string[] => {
  const results = state.searchResults;
  const toolNames = new Set(latestTurnToolMessages(state.messages).map(({ name }) => name));

  return (state.execution.requiredOperations ?? []).filter((operation) => {
    if (toolNames.has(TOOL_NAMES.TRIP_SUMMARY) && TRIP_SUMMARY_OPERATIONS.has(operation)) {
      return false;
    }

    return IS_OPERATION_MISSING[operation](results, toolNames);
  });
};

/** Builds the incomplete-status result for a turn that's still missing required operations. */
export const missingOperationsResult = (
  state: GraphStateType,
  missingOperations: string[],
  reason: string
): ValidationResult => {
  const requiredOperations = state.execution.requiredOperations ?? [];
  const madeProgress = missingOperations.length < requiredOperations.length;

  return madeProgress
    ? { status: SUPERVISOR_STATUSES.INCOMPLETE, reason, retryable: true }
    : { status: SUPERVISOR_STATUSES.INCOMPLETE, reason, missingFields: missingOperations };
};
