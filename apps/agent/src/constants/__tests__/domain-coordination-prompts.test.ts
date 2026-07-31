import { describe, expect, it } from 'vitest';

import { CLASSIFY_SYSTEM_PROMPT, PLAN_TOOLS_SECTION } from '../../constants';

describe('multi-domain coordination instructions', () => {
  it('routes compound search requests to the planning coordinator', () => {
    expect(CLASSIFY_SYSTEM_PROMPT).toContain('combines multiple search domains');
    expect(CLASSIFY_SYSTEM_PROMPT).toContain('hotels + places');
  });

  it('allows the planning coordinator to use the places specialist tool', () => {
    expect(PLAN_TOOLS_SECTION).toContain('placesTool');
  });

  it('runs independent domain searches in parallel and synthesizes once', () => {
    expect(PLAN_TOOLS_SECTION).toContain('run in parallel');
    expect(PLAN_TOOLS_SECTION).toContain('one concise combined response');
  });
});
