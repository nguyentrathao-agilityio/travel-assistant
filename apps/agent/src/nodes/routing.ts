// Schemas
import type { Intent } from '@/schemas';

// Constants
import {
  DOMAIN_AGENT_NODE_NAMES,
  FINALIZATION_NODE_NAME,
  type DomainAgentNodeName,
} from '@/constants';

// State
import type { GraphStateType } from '@/state';

export type BranchName = DomainAgentNodeName | 'refusal';

export const BRANCH_NAMES: BranchName[] = [...DOMAIN_AGENT_NODE_NAMES, 'refusal'];

const INTENT_TO_BRANCH: Record<Intent, BranchName> = {
  explore: 'explore',
  plan: 'plan',
  book_flight: 'bookFlight',
  book_hotel: 'bookHotel',
  cancel_booking: 'cancelBooking',
  general: 'general',
  out_of_scope: 'refusal',
};

/** Maps intent to a graph branch, defaulting to `general`. */
export const routeByIntent = (intent: Intent | undefined): BranchName =>
  intent ? INTENT_TO_BRANCH[intent] : 'general';

export type PostPlanningBranch = 'bookFlight' | 'bookHotel' | typeof FINALIZATION_NODE_NAME;

/** Routes a completed planning agent to its requested handoff, or to normal finalization. */
export const routeAfterPlanning = (state: GraphStateType): PostPlanningBranch =>
  state.handoffTarget ?? FINALIZATION_NODE_NAME;
