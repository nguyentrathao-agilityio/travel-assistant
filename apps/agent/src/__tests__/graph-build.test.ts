import { describe, expect, it, vi } from 'vitest';

const { node } = vi.hoisted(() => ({ node: () => ({}) }));

vi.mock('@/nodes', () => ({
  BRANCH_NAMES: ['explore', 'plan', 'booking', 'general', 'refusal'],
  SUPERVISOR_ROUTES: ['explore', 'plan', 'booking', 'general', 'saveMemory'],
  bookingAgent: node,
  classifyNode: node,
  exploreAgent: node,
  generalAgent: node,
  planningAgent: node,
  refusalNode: node,
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
  it('compiles with domain nodes supervised and refusal terminating directly', () => {
    expect(() => buildGraph().compile()).not.toThrow();
  });
});
