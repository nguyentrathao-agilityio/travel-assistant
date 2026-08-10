import { describe, expect, it, vi } from 'vitest';

const { node } = vi.hoisted(() => ({ node: () => ({}) }));

vi.mock('@/nodes', () => ({
  BRANCH_NAMES: ['explore', 'plan', 'bookFlight', 'bookHotel', 'cancelBooking', 'general'],
  SUPERVISOR_ROUTES: [
    'explore',
    'plan',
    'bookFlight',
    'bookHotel',
    'cancelBooking',
    'general',
    'saveMemory',
  ],
  cancelBookingAgent: node,
  classifyNode: node,
  exploreAgent: node,
  flightBookingAgent: node,
  generalAgent: node,
  hotelBookingAgent: node,
  planningAgent: node,
  routeAfterSupervisor: () => 'saveMemory',
  saveMemoryNode: node,
  supervisorNode: node,
}));

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/constants')>()),
  EXTERNAL_API_RETRY_POLICY: { maxAttempts: 1 },
  POSTGRES_URL: 'postgres://test:test@localhost/test',
}));

vi.mock('@langchain/langgraph-checkpoint-postgres', () => ({
  PostgresSaver: { fromConnString: vi.fn(() => undefined) },
}));

import { buildGraph } from '@/agent';

describe('graph construction', () => {
  it('compiles with every domain node returning through the supervisor', () => {
    expect(() => buildGraph().compile()).not.toThrow();
  });
});
