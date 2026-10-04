import { describe, expect, it } from 'vitest';

import { buildAgentSystemPrompt } from '@/prompts';
import type { GraphStateType } from '@/state';

import { VOICE_MODE_SECTION } from '../sections/voice-mode';

describe('buildAgentSystemPrompt', () => {
  it('requires every response to use the language of the latest user request', () => {
    const prompt = buildAgentSystemPrompt({} as GraphStateType, { toolsSection: 'No tools.' });

    expect(prompt).toContain("Always respond in the language used by the user's latest request");
    expect(prompt).toContain('clarifying questions');
  });
});

describe('buildAgentSystemPrompt voice mode', () => {
  it('adds the voice-mode section only when voiceMode is set', () => {
    const state = {} as GraphStateType;
    const sections = { toolsSection: 'No tools.' };

    expect(buildAgentSystemPrompt(state, sections)).not.toContain(VOICE_MODE_SECTION);
    expect(buildAgentSystemPrompt(state, sections, [], { voiceMode: true })).toContain(
      VOICE_MODE_SECTION
    );
  });
});
