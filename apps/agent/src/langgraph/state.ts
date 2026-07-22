import { Annotation, MessagesAnnotation } from '@langchain/langgraph';
import type { SelectedFlight, HotelAvailability } from '@repo/types';

/**
 * Last-write-wins reducer for bookingState fields — the frontend (via
 * useCoAgent<TripState>) is the sole writer; graph nodes only read these.
 */
const lastValue = <T>() => ({
  reducer: (_current: T | undefined, update: T | undefined) => update,
  default: (): T | undefined => undefined,
});

export const GraphState = Annotation.Root({
  ...MessagesAnnotation.spec,
  flights: Annotation<SelectedFlight | undefined>(lastValue<SelectedFlight>()),
  hotel: Annotation<HotelAvailability | undefined>(lastValue<HotelAvailability>()),
  itineraryActive: Annotation<boolean | undefined>(lastValue<boolean>()),
  destination: Annotation<string | undefined>(lastValue<string>()),
  startDate: Annotation<string | undefined>(lastValue<string>()),
  endDate: Annotation<string | undefined>(lastValue<string>()),
  travelers: Annotation<number | undefined>(lastValue<number>()),
  tools: Annotation<unknown[] | undefined>(lastValue<unknown[]>()),
  clientDate: Annotation<string | undefined>(lastValue<string>()),
  clientTimezone: Annotation<string | undefined>(lastValue<string>()),
});

export type GraphStateType = typeof GraphState.State;
