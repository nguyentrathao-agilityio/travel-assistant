import { StateSchema } from '@langchain/langgraph';
import { createMiddleware } from 'langchain';
import { ToolMessage } from '@langchain/core/messages';

// Constants
import { BOOKING_STATUSES, BOOKING_TYPES, SELECTION_STATUSES, TOOL_NAMES } from '@repo/constants';
import { type DomainAgentNodeName } from '@/constants';

// Utils
import { parseSearchArtifact } from './search-artifacts';
import { graphErrorFromTool } from './tool-errors';
import { latestTurnToolMessages } from './tool-messages';
import { isBookingToolName } from '@/utils/tool';

// Schemas
import { BookingSchema } from '@/schemas/booking';

// State
import { GraphState, type GraphError, type GraphStateType, type SearchResults } from '@/state';

const { messages: _messages, copilotkit: _copilotkit, ...domainStateFields } = GraphState.fields;
const DomainStateSchema = new StateSchema(domainStateFields);

type DomainStateUpdate = typeof DomainStateSchema.Update;

const activeBookingForTool = (
  toolName: string,
  state: Pick<GraphStateType, 'flightBooking' | 'hotelBooking'>
) => {
  const booking =
    toolName === TOOL_NAMES.BOOK_FLIGHT
      ? state.flightBooking
      : toolName === TOOL_NAMES.BOOK_HOTEL
        ? state.hotelBooking
        : undefined;

  return booking?.status === BOOKING_STATUSES.CONFIRMED ? booking : undefined;
};

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

    const { data } = booking;
    const isConfirmed = data.status === BOOKING_STATUSES.CONFIRMED;
    const selectionStatus = isConfirmed ? SELECTION_STATUSES.BOOKED : SELECTION_STATUSES.CANCELLED;
    const selectedId = isConfirmed ? data.referenceId : undefined;

    if (data.type === BOOKING_TYPES.FLIGHT) {
      update.flightSelectionStatus = selectionStatus;
      update.selectedOptions = { flightId: selectedId };
      update.flightBooking = data;
    } else {
      update.hotelSelectionStatus = selectionStatus;
      update.selectedOptions = { hotelId: selectedId };
      update.hotelBooking = data;
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
    wrapToolCall: async (request, handler) => {
      const activeBooking = activeBookingForTool(request.toolCall.name, request.state);

      if (!activeBooking) return handler(request);

      return new ToolMessage({
        tool_call_id: request.toolCall.id ?? '',
        content:
          `Booking blocked: ${activeBooking.confirmationCode} is still an active ${activeBooking.type} booking. ` +
          'Cancel the active booking before creating a replacement.',
      });
    },
    afterAgent: (state): DomainStateUpdate => buildDomainStateUpdate(taskName, state.messages),
  });
