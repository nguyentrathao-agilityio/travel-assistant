import type { GraphStateType } from '../../state';
import { todayIso } from '../date';

/**
 * Renders the client's local date/timezone for the system prompt, falling back to the server's
 * UTC date if the frontend hasn't sent one — so the model always has a "today" to anchor
 * relative dates to.
 */
export const buildClientContext = (state: GraphStateType): string => {
  const today = state.clientDate ?? todayIso();

  return [
    '## Client Date & Timezone',
    `today: ${today} ← always use this value for "today" / "tonight" / relative dates; never guess a date`,
    ...(state.clientTimezone ? [`timezone: ${state.clientTimezone}`] : []),
  ].join('\n');
};
