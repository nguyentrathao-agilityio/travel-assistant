import { describe, expect, it } from 'vitest';

import { SPECIALIZED_AGENT_RECURSION_LIMIT } from '@/constants';
import { withSpecializedAgentConfig } from '@/agent/create-agent';

describe('withSpecializedAgentConfig', () => {
  it('sets the project recursion budget when no config is provided', () => {
    expect(withSpecializedAgentConfig()).toEqual({
      recursionLimit: SPECIALIZED_AGENT_RECURSION_LIMIT,
    });
  });

  it('overrides inherited recursion limits while preserving request-scoped config', () => {
    const callbacks = { handleChainStart: () => undefined } as never;
    const result = withSpecializedAgentConfig({
      callbacks,
      recursionLimit: 25,
      configurable: { thread_id: 'thread-1' },
      metadata: { trace: 'planning' },
    });

    expect(result).toMatchObject({
      callbacks,
      recursionLimit: SPECIALIZED_AGENT_RECURSION_LIMIT,
      configurable: { thread_id: 'thread-1' },
      metadata: { trace: 'planning' },
    });
  });
});
