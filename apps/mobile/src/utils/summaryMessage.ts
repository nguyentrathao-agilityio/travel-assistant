// Constants
import { SUMMARY_MESSAGE_PREFIX } from '@repo/constants';

// Types
import type { Message } from '@copilotkit/react-native/headless';

// LangChain's default prefix, used by threads summarized before SUMMARY_MESSAGE_PREFIX existed.
const LEGACY_SUMMARY_PREFIX = 'Here is a summary of the conversation to date:';

/** The agent's context summary arrives as a user message; it is model context, not conversation. */
export const isSummaryMessage = (message: Message): boolean =>
  message.role === 'user' &&
  typeof message.content === 'string' &&
  (message.content.startsWith(SUMMARY_MESSAGE_PREFIX) ||
    message.content.startsWith(LEGACY_SUMMARY_PREFIX));

export const withoutSummaryMessages = (messages: Message[]): Message[] =>
  messages.some(isSummaryMessage)
    ? messages.filter((message) => !isSummaryMessage(message))
    : messages;
