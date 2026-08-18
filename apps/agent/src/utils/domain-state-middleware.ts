import { createMiddleware } from 'langchain';
import { StateSchema } from '@langchain/langgraph';

// Schemas
import { BookingSchema } from '@/schemas/booking';

// Constants
import {
  BOOKING_STATUSES,
  BOOKING_TYPES,
  isBookingToolName,
  type DomainAgentNodeName,
} from '@/constants';

// State
import { GraphState, SELECTION_STATUSES, type GraphError, type SearchResults } from '@/state';

import { graphErrorFromTool } from './domain-state/tool-errors';
import { parseSearchArtifact } from './domain-state/search-artifacts';
import { latestTurnToolMessages } from './domain-state/tool-messages';

const { messages: _messages, copilotkit: _copilotkit, ...domainStateFields } = GraphState.fields;
const DomainStateSchema = new StateSchema(domainStateFields);

type DomainStateUpdate = typeof DomainStateSchema.Update;

/** Persists validated rich-UI artifacts without changing their message/tool contracts. */
export const buildDomainStateUpdate = (
  taskName: DomainAgentNodeName,
  messages: readonly unknown[]
): DomainStateUpdate => {
  const searchResults: Partial<SearchResults> = {};
  const errors: GraphError[] = [];
  const update: DomainStateUpdate = {
    execution: { currentNode: taskName, completedTasks: [taskName] },
  };

  for (const message of latestTurnToolMessages(messages)) {
    const graphError = graphErrorFromTool(taskName, message);

    if (graphError) errors.push(graphError);
    parseSearchArtifact(message, searchResults);

    const booking = BookingSchema.safeParse(message.artifact);

    if (!booking.success) {
      if (isBookingToolName(message.name ?? '')) {
        console.warn(`[${taskName}] Booking tool artifact failed validation, booking not saved`, {
          tool: message.name,
          error: booking.error.message,
        });
      }
      continue;
    }
    if (
      booking.data.status === BOOKING_STATUSES.CONFIRMED &&
      booking.data.type === BOOKING_TYPES.FLIGHT
    ) {
      update.flightSelectionStatus = SELECTION_STATUSES.BOOKED;
      update.selectedOptions = { flightId: booking.data.referenceId };
      update.flightBooking = booking.data;
    } else if (
      booking.data.status === BOOKING_STATUSES.CONFIRMED &&
      booking.data.type === BOOKING_TYPES.HOTEL
    ) {
      update.hotelSelectionStatus = SELECTION_STATUSES.BOOKED;
      update.selectedOptions = { hotelId: booking.data.referenceId };
      update.hotelBooking = booking.data;
    } else if (
      booking.data.status === BOOKING_STATUSES.CANCELLED &&
      booking.data.type === BOOKING_TYPES.FLIGHT
    ) {
      update.flightSelectionStatus = SELECTION_STATUSES.CANCELLED;
      update.selectedOptions = { flightId: undefined };
      update.flightBooking = booking.data;
    } else if (
      booking.data.status === BOOKING_STATUSES.CANCELLED &&
      booking.data.type === BOOKING_TYPES.HOTEL
    ) {
      update.hotelSelectionStatus = SELECTION_STATUSES.CANCELLED;
      update.selectedOptions = { hotelId: undefined };
      update.hotelBooking = booking.data;
    }
  }

  if (Object.keys(searchResults).length > 0) update.searchResults = searchResults;
  if (errors.length > 0) update.execution = { ...update.execution, errors };

  return update;
};

export const createDomainStateMiddleware = (taskName: DomainAgentNodeName) =>
  createMiddleware<typeof DomainStateSchema>({
    name: `Persist${taskName}State`,
    stateSchema: DomainStateSchema,
    afterAgent: (state): DomainStateUpdate => buildDomainStateUpdate(taskName, state.messages),
  });
