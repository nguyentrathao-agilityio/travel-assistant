import { Flight } from './flight';
import { HotelAvailability } from './hotel';

export interface SelectedFlight {
  departure?: Flight;
  return?: Flight;
}

export type SelectionStatus = 'selected' | 'confirmed' | 'booked';

export interface TripState {
  flights?: SelectedFlight;
  flightSelectionStatus?: SelectionStatus;
  hotel?: HotelAvailability;
  hotelSelectionStatus?: SelectionStatus;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  clientDate?: string;
  clientTimezone?: string;
}
