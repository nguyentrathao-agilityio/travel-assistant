import { BOOKING_EDIT_REJECTION, CANCELLATION_REJECTION_PREFIX } from '@/constants';

export const cancellationRejection = (bookingId: string) =>
  `${CANCELLATION_REJECTION_PREFIX}${bookingId} remains active and was NOT cancelled.`;

export const isIntentionalRejectionResult = (result: unknown) =>
  result === BOOKING_EDIT_REJECTION ||
  (typeof result === 'string' && result.startsWith(CANCELLATION_REJECTION_PREFIX));
