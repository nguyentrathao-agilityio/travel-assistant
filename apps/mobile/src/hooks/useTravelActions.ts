// Hooks
import { useBookingAction } from './useBookingAction';
import { useThemeAction } from './useThemeAction';
import { useTravelBookingActions } from './useTravelBookingActions';
import { useTravelInfoActions } from './useTravelInfoActions';
import { useTripSummaryAction } from './useTripSummaryAction';

// Types
import type { Flight, HotelAvailability, SelectedFlight, TripState } from '@repo/types';

interface UseTravelActionsOptions {
  selectFlight: (flight: Flight, type: keyof SelectedFlight) => void;
  selectHotel: (hotel: HotelAvailability) => void;
  sendMessage: (text: string) => void | Promise<void>;
  state: TripState;
}

/** Registers every CopilotKit tool-render action used by the travel chat — mirrors web's useTravelCopilot. */
export const useTravelActions = ({
  selectFlight,
  selectHotel,
  sendMessage,
  state,
}: UseTravelActionsOptions): void => {
  useTravelInfoActions();
  useTravelBookingActions({ selectFlight, selectHotel, sendMessage, state });
  useBookingAction();
  useTripSummaryAction({ state });
  useThemeAction();
};
