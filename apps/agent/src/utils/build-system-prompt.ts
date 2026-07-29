import type { GraphStateType } from '../state';
import { BASE_SYSTEM_PROMPT } from '../constants';
import { BOOKING_RULES_SECTION } from './system-prompt/booking-rules';
import { buildBookingContext } from './system-prompt/booking-context';
import { buildClientContext } from './system-prompt/client-context';
import { buildMemoryContext } from './system-prompt/memory-context';

export interface BranchPromptSections {
  toolsSection: string;
  includeBookingRules?: boolean;
  includeBookingContext?: boolean;
  includeMemoryContext?: boolean;
}

export const buildBranchSystemPrompt = (
  state: GraphStateType,
  sections: BranchPromptSections,
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
