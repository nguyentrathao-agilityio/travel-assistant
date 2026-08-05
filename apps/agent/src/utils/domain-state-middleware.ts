import { HumanMessage, ToolMessage } from '@langchain/core/messages';
import { createMiddleware } from 'langchain';
import { StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

// Schemas
import {
  DestinationExplorerResultSchema,
  FlightSearchResultSchema,
  HotelSearchResultSchema,
  PlacesSearchResultSchema,
  RouteResultSchema,
  TipsResultSchema,
  TripSummaryResultSchema,
  WeatherResultSchema,
  ToolErrorSchema,
} from '@/schemas';
import { BookingSchema } from '@/schemas/booking';

// Constants
import { TOOL_NAMES } from '@/constants';

// State
import { GraphState, type GraphError, type SearchResults } from '@/state';

export type DomainTaskName =
  | 'general'
  | 'explore'
  | 'plan'
  | 'bookFlight'
  | 'bookHotel'
  | 'cancelBooking';

const latestTurnToolMessages = (messages: readonly unknown[]): ToolMessage[] => {
  let lastHumanIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index] instanceof HumanMessage) {
      lastHumanIndex = index;
      break;
    }
  }
  return messages
    .slice(lastHumanIndex + 1)
    .filter((message): message is ToolMessage => message instanceof ToolMessage);
};

const { messages: _messages, copilotkit: _copilotkit, ...domainStateFields } = GraphState.fields;
const DomainStateSchema = new StateSchema(domainStateFields);
type DomainStateUpdate = typeof DomainStateSchema.Update;

const WRITE_TASKS = new Set<DomainTaskName>(['bookFlight', 'bookHotel', 'cancelBooking']);

const graphErrorCode = (
  taskName: DomainTaskName,
  code: z.infer<typeof ToolErrorSchema>['code']
): GraphError['code'] => {
  if (WRITE_TASKS.has(taskName) && code === 'TIMEOUT') return 'WRITE_STATUS_UNKNOWN';
  if (code === 'VALIDATION_ERROR') return 'VALIDATION_ERROR';
  if (code === 'TIMEOUT') return 'TIMEOUT';
  if (code === 'RATE_LIMITED') return 'RATE_LIMIT';
  return 'PROVIDER_ERROR';
};

const graphErrorFromTool = (
  taskName: DomainTaskName,
  message: ToolMessage
): GraphError | undefined => {
  const parsed = ToolErrorSchema.safeParse(message.artifact);
  if (!parsed.success) return undefined;
  const isWrite = WRITE_TASKS.has(taskName);
  return {
    node: taskName,
    operation: message.name ?? 'unknownTool',
    provider: parsed.data.provider,
    code: graphErrorCode(taskName, parsed.data.code),
    message:
      isWrite && parsed.data.code === 'TIMEOUT'
        ? 'The provider may have received the write request. Verify the booking status before trying again.'
        : parsed.data.message,
    retryable: isWrite ? false : parsed.data.retryable,
  };
};

const parseSearchResult = (message: ToolMessage, searchResults: Partial<SearchResults>): void => {
  const { artifact, name } = message;
  if (artifact === undefined || message.status === 'error') return;

  if (name === TOOL_NAMES.WEATHER) {
    const parsed = WeatherResultSchema.safeParse(artifact);
    if (parsed.success) searchResults.weather = parsed.data;
  } else if (name === TOOL_NAMES.FLIGHTS) {
    const parsed = FlightSearchResultSchema.safeParse(artifact);
    if (parsed.success) searchResults.flights = parsed.data;
  } else if (name === TOOL_NAMES.HOTEL) {
    const parsed = HotelSearchResultSchema.safeParse(artifact);
    if (parsed.success) searchResults.hotels = parsed.data;
  } else if (name === TOOL_NAMES.PLACES) {
    const parsed = PlacesSearchResultSchema.safeParse(artifact);
    if (parsed.success) searchResults.places = parsed.data;
  } else if (name === TOOL_NAMES.ROUTE) {
    const parsed = RouteResultSchema.safeParse(artifact);
    if (parsed.success) searchResults.route = parsed.data;
  } else if (name === TOOL_NAMES.LOCAL_TIPS) {
    const parsed = TipsResultSchema.safeParse(artifact);
    if (parsed.success) searchResults.localTips = parsed.data;
  } else if (name === TOOL_NAMES.DESTINATION_EXPLORER) {
    const parsed = DestinationExplorerResultSchema.safeParse(artifact);
    if (!parsed.success) return;
    if (parsed.data.weather) searchResults.weather = parsed.data.weather;
    if (parsed.data.places) searchResults.places = parsed.data.places;
    if (parsed.data.tips) searchResults.localTips = parsed.data.tips;
  } else if (name === TOOL_NAMES.TRIP_SUMMARY) {
    const parsed = TripSummaryResultSchema.safeParse(artifact);
    if (parsed.success && parsed.data.route) searchResults.route = parsed.data.route;
  }
};

/** Persists validated rich-UI artifacts without changing their message/tool contracts. */
export const buildDomainStateUpdate = (
  taskName: DomainTaskName,
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
    parseSearchResult(message, searchResults);

    const booking = BookingSchema.safeParse(message.artifact);
    if (!booking.success) continue;
    if (booking.data.status === 'confirmed' && booking.data.type === 'flight') {
      update.flightSelectionStatus = 'booked';
      update.selectedOptions = { flightId: booking.data.referenceId };
    } else if (booking.data.status === 'confirmed' && booking.data.type === 'hotel') {
      update.hotelSelectionStatus = 'booked';
      update.selectedOptions = { hotelId: booking.data.referenceId };
    }
  }

  if (Object.keys(searchResults).length > 0) update.searchResults = searchResults;
  if (errors.length > 0) update.execution = { ...update.execution, errors };
  return update;
};

export const createDomainStateMiddleware = (taskName: DomainTaskName) =>
  createMiddleware<typeof DomainStateSchema>({
    name: `Persist${taskName}State`,
    stateSchema: DomainStateSchema,
    afterAgent: (state): DomainStateUpdate => buildDomainStateUpdate(taskName, state.messages),
  });
