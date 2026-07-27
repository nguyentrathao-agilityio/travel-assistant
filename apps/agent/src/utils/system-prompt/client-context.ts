import type { GraphStateType } from '../../state';
import { todayIso } from '../date';

export const buildClientContext = (state: GraphStateType): string => {
  const today = state.clientDate ?? todayIso();

  return [
    '## Client Date & Timezone',
    `today: ${today} ← always use this value for "today" / "tonight" / relative dates; never guess a date`,
    ...(state.clientTimezone ? [`timezone: ${state.clientTimezone}`] : []),
  ].join('\n');
};
