// Constants
import {
  BOOKING_OPERATIONS,
  DOMAIN_AGENT_NODE_NAMES,
  FINALIZATION_NODE_NAME,
  type DomainAgentNodeName,
} from '@/constants';
import type { BookingOperation } from '@/constants';

// Schemas
import type { Intent } from '@/schemas';

// State
import type { GraphStateType } from '@/state';

export type BranchName = DomainAgentNodeName | 'refusal';

export const BRANCH_NAMES: BranchName[] = [...DOMAIN_AGENT_NODE_NAMES, 'refusal'];

const INTENT_TO_BRANCH: Record<Intent, BranchName> = {
  explore: 'explore',
  plan: 'plan',
  book_flight: 'booking',
  book_hotel: 'booking',
  cancel_booking: 'booking',
  general: 'general',
  out_of_scope: 'refusal',
};

/** Maps intent to a graph branch, defaulting to `general`. */
export const routeByIntent = (intent: Intent | undefined): BranchName =>
  intent ? INTENT_TO_BRANCH[intent] : 'general';

const BOOKING_OPERATION_BY_INTENT: Partial<Record<Intent, BookingOperation>> = {
  book_flight: BOOKING_OPERATIONS.FLIGHT,
  book_hotel: BOOKING_OPERATIONS.HOTEL,
  cancel_booking: BOOKING_OPERATIONS.CANCEL,
};

/** Resolves direct booking intents to the operation handled by the unified booking agent. */
export const bookingOperationByIntent = (intent: Intent): BookingOperation | undefined =>
  BOOKING_OPERATION_BY_INTENT[intent];

export type PostPlanningBranch = 'booking' | typeof FINALIZATION_NODE_NAME;

/** Routes a completed planning agent to its requested handoff, or to normal finalization. */
export const routeAfterPlanning = (state: GraphStateType): PostPlanningBranch =>
  state.handoffTarget ?? FINALIZATION_NODE_NAME;
