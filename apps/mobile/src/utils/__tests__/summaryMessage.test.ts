import { SUMMARY_MESSAGE_PREFIX } from '@repo/constants';

import { isSummaryMessage, withoutSummaryMessages } from '../summaryMessage';

import type { Message } from '@copilotkit/react-native/headless';

const summary = (id: string): Message => ({
  id,
  role: 'user',
  content: `${SUMMARY_MESSAGE_PREFIX}\n\nEarlier we compared flights.`,
});
const question: Message = { id: 'u1', role: 'user', content: 'Hotels in Hue?' };

test('recognises only user messages that start with the summary prefix', () => {
  expect(isSummaryMessage(summary('s1'))).toBe(true);
  expect(isSummaryMessage(question)).toBe(false);
  expect(
    isSummaryMessage({ id: 'a1', role: 'assistant', content: `${SUMMARY_MESSAGE_PREFIX} quoted` })
  ).toBe(false);
});

test.each([
  ['first', [summary('s1'), question]],
  ['last', [question, summary('s1')]],
  ['only', [summary('s1')]],
])('removes the summary when it is %s', (_position, messages) => {
  expect(withoutSummaryMessages(messages).some(isSummaryMessage)).toBe(false);
});

test('returns the same array when there is no summary', () => {
  const messages = [question];

  expect(withoutSummaryMessages(messages)).toBe(messages);
});

test('also recognises summaries written with the LangChain default prefix', () => {
  expect(
    isSummaryMessage({
      id: 's0',
      role: 'user',
      content: 'Here is a summary of the conversation to date:\n\nEarlier...',
    })
  ).toBe(true);
});
