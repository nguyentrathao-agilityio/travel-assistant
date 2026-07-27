import type { Intent } from '../schemas/intent';

export type BranchName =
  | 'explore'
  | 'plan'
  | 'bookFlight'
  | 'bookHotel'
  | 'cancelBooking'
  | 'general';

export const BRANCH_NAMES: BranchName[] = [
  'explore',
  'plan',
  'bookFlight',
  'bookHotel',
  'cancelBooking',
  'general',
];

const INTENT_TO_BRANCH: Record<Intent, BranchName> = {
  explore: 'explore',
  plan: 'plan',
  book_flight: 'bookFlight',
  book_hotel: 'bookHotel',
  cancel_booking: 'cancelBooking',
  general: 'general',
};

export const routeByIntent = (intent: Intent | undefined): BranchName =>
  intent ? INTENT_TO_BRANCH[intent] : 'general';
