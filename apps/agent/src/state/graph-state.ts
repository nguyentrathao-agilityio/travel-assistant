import { CopilotKitStateSchema, zodState } from '@copilotkit/sdk-js/langgraph';
import { ReducedValue, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

// Constants
import { SELECTION_STATUSES } from '@repo/constants';
import { BOOKING_OPERATIONS, DOMAIN_NODE_NAME } from '@/constants';

// Schemas
import { BookingSchema, FlightSchema, HotelAvailabilitySchema, IntentSchema } from '@/schemas';

// State
import { ExecutionStateSchema, ExecutionUpdateSchema, mergeExecutionState } from './execution';
import { mergeRequest, TravelRequestSchema, TravelRequestUpdateSchema } from './request';
import {
  mergeSearchResults,
  SearchResultsSchema,
  SearchResultsUpdateSchema,
} from './search-results';
import {
  mergeSelectedOptions,
  SelectedOptionsSchema,
  SelectedOptionsUpdateSchema,
} from './selection';
import { SupervisorStateSchema } from './supervisor';

const SelectedFlightSchema = z.object({
  departure: FlightSchema.optional(),
  return: FlightSchema.optional(),
});

const SelectionStatusSchema = z.enum([
  SELECTION_STATUSES.SELECTED,
  SELECTION_STATUSES.CONFIRMED,
  SELECTION_STATUSES.BOOKED,
  SELECTION_STATUSES.CANCELLED,
]);

export const GraphState = new StateSchema({
  ...CopilotKitStateSchema.fields,

  // Existing UI-owned booking selection fields. Retained for checkpoint and CopilotKit compatibility.
  flights: zodState(SelectedFlightSchema.optional()),
  flightSelectionStatus: zodState(SelectionStatusSchema.optional()),
  flightBooking: zodState(BookingSchema.optional()),
  hotel: zodState(HotelAvailabilitySchema.optional()),
  hotelSelectionStatus: zodState(SelectionStatusSchema.optional()),
  hotelBooking: zodState(BookingSchema.optional()),
  destination: zodState(z.string().optional()),
  startDate: zodState(z.string().optional()),
  endDate: zodState(z.string().optional()),
  travelers: zodState(z.number().int().positive().optional()),
  clientDate: zodState(z.string().optional()),
  clientTimezone: zodState(z.string().optional()),
  intent: zodState(IntentSchema.optional()),
  refusalMessage: zodState(z.string().optional().nullable()),
  bookingOperation: zodState(
    z
      .enum([BOOKING_OPERATIONS.FLIGHT, BOOKING_OPERATIONS.HOTEL, BOOKING_OPERATIONS.CANCEL])
      .optional()
  ),
  handoffTarget: zodState(z.literal(DOMAIN_NODE_NAME.BOOKING).optional()),

  // Explicit, serializable business state for node-to-node coordination.
  request: new ReducedValue(zodState(TravelRequestSchema.default(() => ({}))), {
    inputSchema: zodState(TravelRequestUpdateSchema),
    reducer: mergeRequest,
  }),
  searchResults: new ReducedValue(zodState(SearchResultsSchema.default(() => ({}))), {
    inputSchema: zodState(SearchResultsUpdateSchema),
    reducer: mergeSearchResults,
  }),
  selectedOptions: new ReducedValue(zodState(SelectedOptionsSchema), {
    inputSchema: zodState(SelectedOptionsUpdateSchema),
    reducer: mergeSelectedOptions,
  }),
  execution: new ReducedValue(zodState(ExecutionStateSchema), {
    inputSchema: zodState(ExecutionUpdateSchema),
    reducer: mergeExecutionState,
  }),
  supervisor: zodState(SupervisorStateSchema),
});

export type GraphStateType = typeof GraphState.State;
export type GraphStateUpdate = typeof GraphState.Update;
