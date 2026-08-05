import type { GraphStateType } from '../state';
import { BOOKING_RULES_SECTION } from './sections/booking-rules';
import { buildBookingContext } from './sections/booking-context';
import { buildClientContext } from './sections/client-context';
import { buildMemoryContext } from './sections/memory-context';
import { BASE_SYSTEM_PROMPT } from './templates';

export interface AgentPromptSections {
  toolsSection: string;
  includeBookingRules?: boolean;
  includeBookingContext?: boolean;
  includeMemoryContext?: boolean;
}

export const buildAgentSystemPrompt = (
  state: GraphStateType,
  sections: AgentPromptSections,
  memories: string[] = []
): string =>
  [
    BASE_SYSTEM_PROMPT,
    sections.toolsSection,
    sections.includeBookingRules ? BOOKING_RULES_SECTION : null,
    sections.includeBookingContext ? buildBookingContext(state) : null,
    buildClientContext(state),
    sections.includeMemoryContext ? buildMemoryContext(memories) : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join('\n\n');
