// Schemas
import type { Intent } from '@/schemas';

// Constants
import {
  BOOKING_OPERATIONS,
  DOMAIN_AGENT_NODE_NAMES,
  type BookingOperation,
  type DomainAgentNodeName,
} from './agents';

export type BranchName = DomainAgentNodeName | 'refusal';

export const BRANCH_NAMES: BranchName[] = [...DOMAIN_AGENT_NODE_NAMES, 'refusal'];

export const INTENT_TO_BRANCH: Record<Intent, BranchName> = {
  explore: 'explore',
  plan: 'plan',
  book_flight: 'booking',
  book_hotel: 'booking',
  cancel_booking: 'booking',
  general: 'general',
  out_of_scope: 'refusal',
};

export const BOOKING_OPERATION_BY_INTENT: Partial<Record<Intent, BookingOperation>> = {
  book_flight: BOOKING_OPERATIONS.FLIGHT,
  book_hotel: BOOKING_OPERATIONS.HOTEL,
  cancel_booking: BOOKING_OPERATIONS.CANCEL,
};
