import { describe, expect, it } from 'vitest';

import { CLASSIFY_SYSTEM_PROMPT, PLANNING_AGENT_TOOLS_PROMPT } from '../../constants';

describe('multi-domain coordination instructions', () => {
  it('routes compound search requests to the planning coordinator', () => {
    expect(CLASSIFY_SYSTEM_PROMPT).toContain('combines multiple search domains');
    expect(CLASSIFY_SYSTEM_PROMPT).toContain('hotels + places');
  });

  it('allows the planning coordinator to use the places specialist tool', () => {
    expect(PLANNING_AGENT_TOOLS_PROMPT).toContain('placesTool');
  });

  it('runs independent domain searches in parallel and synthesizes once', () => {
    expect(PLANNING_AGENT_TOOLS_PROMPT).toContain('run in parallel');
    expect(PLANNING_AGENT_TOOLS_PROMPT).toContain('one concise combined response');
  });
});
