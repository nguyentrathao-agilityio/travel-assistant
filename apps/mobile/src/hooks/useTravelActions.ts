// Hooks
import { useBookingAction } from './useBookingAction';
import { useDestinationExplorerAction } from './useDestinationExplorerAction';
import { useFlightAction } from './useFlightAction';
import { useHotelAction } from './useHotelAction';
import { useLocalTipsAction } from './useLocalTipsAction';
import { usePlacesAction } from './usePlacesAction';
import { useRouteAction } from './useRouteAction';
import { useThemeAction } from './useThemeAction';
import { useTripSummaryAction } from './useTripSummaryAction';
import { useWeatherAction } from './useWeatherAction';

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
  useWeatherAction();
  usePlacesAction();
  useRouteAction();
  useLocalTipsAction();
  useDestinationExplorerAction();
  useFlightAction({ selectFlight, sendMessage, state });
  useHotelAction({ selectHotel, sendMessage, state });
  useBookingAction();
  useTripSummaryAction({ state });
  useThemeAction();
};
