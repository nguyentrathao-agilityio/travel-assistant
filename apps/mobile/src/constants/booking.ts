// Constants
import { BOOKING_ACTIONS } from '@repo/constants';

// Not editable — changing them wouldn't re-run price/availability revalidation.
export const NON_EDITABLE_DETAIL_KEYS = new Set(['flightId', 'hotelId']);

export const BOOKING_ACTION_ICON: Record<string, string> = {
  [BOOKING_ACTIONS.CREATE_FLIGHT]: '✈️',
  [BOOKING_ACTIONS.CANCEL]: '⚠️',
  [BOOKING_ACTIONS.CREATE_HOTEL]: '🏨',
};

export const SUBMIT_TIMEOUT_MESSAGE = 'This is taking longer than expected. Please try again.';
export const SUBMIT_TIMEOUT_MS = 20000;
