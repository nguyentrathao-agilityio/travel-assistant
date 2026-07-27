import { StateSchema } from '@langchain/langgraph';
import { CopilotKitStateSchema, zodState } from '@copilotkit/sdk-js/langgraph';
import { z } from 'zod';
import type { SelectedFlight, HotelAvailability, SelectionStatus } from '@repo/types';
import { IntentSchema } from './schemas/intent';

export const GraphState = new StateSchema({
  ...CopilotKitStateSchema.fields,
  flights: zodState(z.custom<SelectedFlight>().optional()),
  flightSelectionStatus: zodState(z.custom<SelectionStatus>().optional()),
  hotel: zodState(z.custom<HotelAvailability>().optional()),
  hotelSelectionStatus: zodState(z.custom<SelectionStatus>().optional()),
  destination: zodState(z.string().optional()),
  startDate: zodState(z.string().optional()),
  endDate: zodState(z.string().optional()),
  travelers: zodState(z.number().optional()),
  clientDate: zodState(z.string().optional()),
  clientTimezone: zodState(z.string().optional()),
  intent: zodState(IntentSchema.optional()),
});

export type GraphStateType = typeof GraphState.State;
