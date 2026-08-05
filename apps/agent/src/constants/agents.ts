export const DOMAIN_AGENT_NODE_NAMES = [
  'explore',
  'plan',
  'bookFlight',
  'bookHotel',
  'cancelBooking',
  'general',
] as const;

export type DomainAgentNodeName = (typeof DOMAIN_AGENT_NODE_NAMES)[number];

export const WRITE_AGENT_NODE_NAMES = [
  'bookFlight',
  'bookHotel',
  'cancelBooking',
] as const satisfies readonly DomainAgentNodeName[];

export const FINALIZATION_NODE_NAME = 'saveMemory' as const;

export type SupervisorNextNode = DomainAgentNodeName | typeof FINALIZATION_NODE_NAME;
