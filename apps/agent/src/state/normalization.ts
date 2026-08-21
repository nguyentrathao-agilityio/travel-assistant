// State
import { createDefaultExecutionState } from './execution';
import type { GraphStateType } from './graph-state';
import { createDefaultSelectedOptions } from './selection';
import { SUPERVISOR_STATUSES } from './supervisor';

/** Fills fields absent from checkpoints created before explicit business state was introduced. */
export const normalizeGraphState = (state: Partial<GraphStateType>): Partial<GraphStateType> => ({
  ...state,
  request: {
    ...(state.intent ? { intent: state.intent } : {}),
    ...(state.destination ? { destination: state.destination } : {}),
    ...(state.startDate ? { departureDate: state.startDate } : {}),
    ...(state.endDate ? { returnDate: state.endDate } : {}),
    ...(state.travelers ? { travelers: state.travelers } : {}),
    ...(state.request ?? {}),
  },
  searchResults: state.searchResults ?? {},
  selectedOptions: state.selectedOptions ?? createDefaultSelectedOptions(),
  execution: {
    ...createDefaultExecutionState(),
    ...(state.execution ?? {}),
  },
  supervisor: state.supervisor ?? { status: SUPERVISOR_STATUSES.PENDING },
});
