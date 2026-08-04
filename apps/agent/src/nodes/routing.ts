import type { Intent } from '../schemas/intent';
import type { GraphStateType } from '../state';

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

/** Maps a classified intent to its graph branch; an undefined intent (classification failure) falls back to `general`. */
export const routeByIntent = (intent: Intent | undefined): BranchName =>
  intent ? INTENT_TO_BRANCH[intent] : 'general';

export type PostPlanningBranch = 'bookFlight' | 'bookHotel' | 'saveMemory';

/** Routes a completed planning agent to its requested handoff, or to normal finalization. */
export const routeAfterPlanning = (state: GraphStateType): PostPlanningBranch =>
  state.handoffTarget ?? 'saveMemory';
