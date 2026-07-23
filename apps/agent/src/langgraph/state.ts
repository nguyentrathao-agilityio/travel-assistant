import { Annotation } from '@langchain/langgraph';
import { CopilotKitStateAnnotation } from '@copilotkit/sdk-js/langgraph';
import type { SelectedFlight, HotelAvailability, SelectionStatus } from '@repo/types';

/**
 * Last-write-wins reducer for bookingState fields — the frontend (via
 * useCoAgent<TripState>) is the sole writer; graph nodes only read these.
 */
const lastValue = <T>() => ({
  reducer: (_current: T | undefined, update: T | undefined) => update,
  default: (): T | undefined => undefined,
});

export const GraphState = Annotation.Root({
  ...CopilotKitStateAnnotation.spec,
  flights: Annotation<SelectedFlight | undefined>(lastValue<SelectedFlight>()),
  flightSelectionStatus: Annotation<SelectionStatus | undefined>(lastValue<SelectionStatus>()),
  hotel: Annotation<HotelAvailability | undefined>(lastValue<HotelAvailability>()),
  hotelSelectionStatus: Annotation<SelectionStatus | undefined>(lastValue<SelectionStatus>()),
  destination: Annotation<string | undefined>(lastValue<string>()),
  startDate: Annotation<string | undefined>(lastValue<string>()),
  endDate: Annotation<string | undefined>(lastValue<string>()),
  travelers: Annotation<number | undefined>(lastValue<number>()),
  clientDate: Annotation<string | undefined>(lastValue<string>()),
  clientTimezone: Annotation<string | undefined>(lastValue<string>()),
});

export type GraphStateType = typeof GraphState.State;
