import { useBookedActions } from './useBookedActions';
import { useBookingAction } from './useBookingAction';
import { useBookingContext } from './useBookingContext';
import { useDefaultToolRenderer } from './useDefaultToolRenderer';
import { useDestinationExplorerAction } from './useDestinationExplorerAction';
import { useFlightAction } from './useFlightAction';
import { useHotelAction } from './useHotelAction';
import { useLocalTipsAction } from './useLocalTipsAction';
import { usePlacesAction } from './usePlacesAction';
import { useRouteAction } from './useRouteAction';
import { useThemeAction } from './useThemeAction';
import { useTitleSync } from './useTitleSync';
import { useTripSummaryAction } from './useTripSummaryAction';
import { useWeatherAction } from './useWeatherAction';

/** Registers every CopilotKit integration used by the travel chat. */
export const useTravelCopilot = () => {
  useBookingContext();
  useDefaultToolRenderer();
  useBookingAction();
  useFlightAction();
  useHotelAction();
  useWeatherAction();
  usePlacesAction();
  useRouteAction();
  useLocalTipsAction();
  useTripSummaryAction();
  useDestinationExplorerAction();
  useTitleSync();
  useBookedActions();
  useThemeAction();
};
