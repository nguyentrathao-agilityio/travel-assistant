// State
import type { GraphStateType } from './graph-state';

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
  selectedOptions: state.selectedOptions ?? { placeIds: [] },
  execution: {
    completedTasks: [],
    missingFields: [],
    errors: [],
    retryCount: {},
    requiredOperations: [],
    ...(state.execution ?? {}),
  },
  supervisor: state.supervisor ?? { status: 'pending' },
});
