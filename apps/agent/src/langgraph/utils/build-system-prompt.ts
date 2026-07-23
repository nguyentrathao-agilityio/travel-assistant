import type { GraphStateType } from '../state';
import { SYSTEM_PROMPT } from '../constants';
import { BOOKING_RULES_SECTION } from './system-prompt/booking-rules';
import { buildBookingContext } from './system-prompt/booking-context';
import { buildClientContext } from './system-prompt/client-context';

export const buildSystemPrompt = (state: GraphStateType): string => {
  return [
    SYSTEM_PROMPT,
    BOOKING_RULES_SECTION,
    buildBookingContext(state),
    buildClientContext(state),
  ].join('\n\n');
};
