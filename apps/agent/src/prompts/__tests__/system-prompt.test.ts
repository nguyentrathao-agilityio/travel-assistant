import { describe, expect, it } from 'vitest';

import { buildAgentSystemPrompt } from '@/prompts';
import type { GraphStateType } from '@/state';

describe('buildAgentSystemPrompt', () => {
  it('requires every response to use the language of the latest user request', () => {
    const prompt = buildAgentSystemPrompt({} as GraphStateType, { toolsSection: 'No tools.' });

    expect(prompt).toContain("Always respond in the language used by the user's latest request");
    expect(prompt).toContain('clarifying questions');
  });
});
