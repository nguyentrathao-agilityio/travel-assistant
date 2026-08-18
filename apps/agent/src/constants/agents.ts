export const DOMAIN_AGENT_NODE_NAMES = ['explore', 'plan', 'booking', 'general'] as const;

export type DomainAgentNodeName = (typeof DOMAIN_AGENT_NODE_NAMES)[number];

export const DOMAIN_NODE_NAME = {
  EXPLORE: 'explore',
  PLAN: 'plan',
  BOOKING: 'booking',
  GENERAL: 'general',
} as const satisfies Record<string, DomainAgentNodeName>;

export const INFRASTRUCTURE_NODE_NAME = {
  CLASSIFY: 'classify',
  REFUSAL: 'refusal',
  SUPERVISOR: 'supervisor',
} as const;

/** Domain nodes whose turn can be safely retried on a transient failure. */
export const RETRYABLE_DOMAIN_NODE_NAMES: ReadonlySet<string> = new Set([
  DOMAIN_NODE_NAME.EXPLORE,
  DOMAIN_NODE_NAME.PLAN,
]);

export const BOOKING_TYPES = { FLIGHT: 'flight', HOTEL: 'hotel' } as const;
export type BookingType = (typeof BOOKING_TYPES)[keyof typeof BOOKING_TYPES];

export const BOOKING_STATUSES = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_OPERATIONS = {
  FLIGHT: 'flight',
  HOTEL: 'hotel',
  CANCEL: 'cancel',
} as const;

export type BookingOperation = (typeof BOOKING_OPERATIONS)[keyof typeof BOOKING_OPERATIONS];

export const WRITE_AGENT_NODE_NAMES = ['booking'] as const satisfies readonly DomainAgentNodeName[];

export const FINALIZATION_NODE_NAME = 'saveMemory' as const;

export type SupervisorNextNode = DomainAgentNodeName | typeof FINALIZATION_NODE_NAME;
