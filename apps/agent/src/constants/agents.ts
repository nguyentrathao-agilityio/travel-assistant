export const DOMAIN_AGENT_NODE_NAMES = [
  'explore',
  'plan',
  'bookFlight',
  'bookHotel',
  'cancelBooking',
  'general',
] as const;

export type DomainAgentNodeName = (typeof DOMAIN_AGENT_NODE_NAMES)[number];

export const DOMAIN_NODE_NAME = {
  EXPLORE: 'explore',
  PLAN: 'plan',
  BOOK_FLIGHT: 'bookFlight',
  BOOK_HOTEL: 'bookHotel',
  CANCEL_BOOKING: 'cancelBooking',
  GENERAL: 'general',
} as const satisfies Record<string, DomainAgentNodeName>;

/** Domain nodes whose turn can be safely retried on a transient failure. */
export const RETRYABLE_DOMAIN_NODE_NAMES: ReadonlySet<string> = new Set([
  DOMAIN_NODE_NAME.EXPLORE,
  DOMAIN_NODE_NAME.PLAN,
]);

export const BOOKING_TYPES = { FLIGHT: 'flight', HOTEL: 'hotel' } as const;
export type BookingType = (typeof BOOKING_TYPES)[keyof typeof BOOKING_TYPES];

export const WRITE_AGENT_NODE_NAMES = [
  'bookFlight',
  'bookHotel',
  'cancelBooking',
] as const satisfies readonly DomainAgentNodeName[];

export const FINALIZATION_NODE_NAME = 'saveMemory' as const;

export type SupervisorNextNode = DomainAgentNodeName | typeof FINALIZATION_NODE_NAME;
