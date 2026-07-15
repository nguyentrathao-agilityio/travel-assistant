import { STATE_KEYS, VALUE_KEYS, CONTEXT_CLIENT_DATE, CONTEXT_CLIENT_TIMEZONE } from '@/constants';
import { todayIso } from './date';

type RequestContext = { get: (key: string) => unknown };

export const buildInstructions = (prompt: string, requestContext: RequestContext): string => {
  const today = (requestContext.get(CONTEXT_CLIENT_DATE) as string | null) ?? todayIso();
  const timezone = requestContext.get(CONTEXT_CLIENT_TIMEZONE) as string | null;

  const bookingState = STATE_KEYS.map((key) => {
    const value = requestContext.get(key);
    if (!value) return `state.${key} is NULL — no ${key} yet.`;
    if (VALUE_KEYS.has(key)) return `state.${key} = "${value}" — confirmed by user.`;

    return `state.${key} is SET — user has confirmed ${key}.`;
  }).join('\n');

  const clientDate = [
    `## Client Date & Timezone`,
    `today: ${today} ← always use this value for "today" / "tonight"; never guess a date`,
    ...(timezone ? [`timezone: ${timezone}`] : []),
  ].join('\n');

  return [prompt, `## Current Booking State\n${bookingState}`, clientDate].join('\n\n');
};
