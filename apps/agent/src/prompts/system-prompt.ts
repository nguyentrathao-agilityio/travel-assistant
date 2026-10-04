// Prompts
import { buildBookingContext } from './sections/booking-context';
import { BOOKING_RULES_SECTION } from './sections/booking-rules';
import { buildClientContext } from './sections/client-context';
import { buildMemoryContext } from './sections/memory-context';
import { VOICE_MODE_SECTION } from './sections/voice-mode';
import { BASE_SYSTEM_PROMPT } from './templates';

// State
import type { GraphStateType } from '@/state';

export interface AgentPromptSections {
  toolsSection: string;
  includeBookingRules?: boolean;
  includeBookingContext?: boolean;
  includeMemoryContext?: boolean;
}

export const buildAgentSystemPrompt = (
  state: GraphStateType,
  sections: AgentPromptSections,
  memories: string[] = [],
  options: { voiceMode?: boolean } = {}
): string =>
  [
    BASE_SYSTEM_PROMPT,
    sections.toolsSection,
    sections.includeBookingRules ? BOOKING_RULES_SECTION : null,
    sections.includeBookingContext ? buildBookingContext(state) : null,
    buildClientContext(state),
    sections.includeMemoryContext ? buildMemoryContext(memories) : null,
    options.voiceMode ? VOICE_MODE_SECTION : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join('\n\n');
