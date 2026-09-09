import { BOOKING_CREATION_DECLINED_MESSAGE, CANCELLATION_DECLINED_PREFIX } from '@repo/constants';

const BOOKING_BLOCKED_PREFIX = 'Booking blocked:';

export const cancellationRejection = (bookingId: string): string =>
  `${CANCELLATION_DECLINED_PREFIX}${bookingId} remains active and was NOT cancelled.`;

export const isIntentionalRejectionResult = (result: unknown): boolean =>
  result === BOOKING_CREATION_DECLINED_MESSAGE ||
  (typeof result === 'string' && result.startsWith(CANCELLATION_DECLINED_PREFIX));

export const isBookingBlockedResult = (result: unknown): boolean =>
  typeof result === 'string' && result.startsWith(BOOKING_BLOCKED_PREFIX);
