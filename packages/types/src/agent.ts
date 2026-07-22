import { Flight } from './flight';
import { HotelAvailability } from './hotel';

export interface SelectedFlight {
  departure?: Flight;
  return?: Flight;
}

export interface TripState {
  flights?: SelectedFlight;
  hotel?: HotelAvailability;
  itineraryActive?: boolean;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  clientDate?: string;
  clientTimezone?: string;
}
