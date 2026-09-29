export const RICH_UI_RESPONSE_INSTRUCTION =
  'A structured UI card displays the result details. Give one concise summary sentence and, when useful, one brief next-step question. Do not repeat item names, prices, addresses, schedules, amenities, or other card details.';

export const buildToolErrorPrompt = (
  code: string,
  provider: string,
  retryable: boolean
): string => {
  const action = retryable
    ? 'Tell the user they can try again; do not expose provider internals.'
    : 'Tell the user the operation cannot be retried automatically; do not expose provider internals.';

  return `The tool failed with ${code} from ${provider}. ${action}`;
};
