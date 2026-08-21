import { SELECTION_STATUSES } from '@repo/constants';

import { Booking } from './booking';
import { Flight } from './flight';
import { HotelAvailability } from './hotel';

export interface SelectedFlight {
  departure?: Flight;
  return?: Flight;
}

export type SelectionStatus = (typeof SELECTION_STATUSES)[keyof typeof SELECTION_STATUSES];

export interface TripState {
  flights?: SelectedFlight;
  flightSelectionStatus?: SelectionStatus;
  flightBooking?: Booking;
  hotel?: HotelAvailability;
  hotelSelectionStatus?: SelectionStatus;
  hotelBooking?: Booking;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  clientDate?: string;
  clientTimezone?: string;
}
