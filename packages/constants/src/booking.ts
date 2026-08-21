export const BOOKING_TYPES = { FLIGHT: 'flight', HOTEL: 'hotel' } as const;

export const BOOKING_STATUSES = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_DECISIONS = {
  APPROVE: 'approve',
  EDIT: 'edit',
  REJECT: 'reject',
} as const;

export const BOOKING_APPROVAL_DECISIONS = [
  BOOKING_DECISIONS.APPROVE,
  BOOKING_DECISIONS.REJECT,
] as const;

export const BOOKING_ACTIONS = {
  CREATE_FLIGHT: 'create_flight_booking',
  CREATE_HOTEL: 'create_hotel_booking',
  CANCEL: 'cancel_booking',
} as const;

export const BOOKING_APPROVAL_REQUEST_TYPE = 'booking_approval';

export const SELECTION_STATUSES = {
  SELECTED: 'selected',
  CONFIRMED: 'confirmed',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_EDIT_REJECTION_PREFIX = 'The user requested changes.';
export const BOOKING_REQUEST_CANCELLATION_PREFIX = 'The user cancelled the booking request.';
export const CANCELLATION_REJECTION_PREFIX = 'The user rejected the cancellation.';

export const BOOKING_CREATION_DECLINED_MESSAGE = `${BOOKING_REQUEST_CANCELLATION_PREFIX} The booking was NOT created.`;
export const CANCELLATION_DECLINED_PREFIX = `${CANCELLATION_REJECTION_PREFIX} Booking `;
