// Constants
import { CHAT_ROLE, COAGENT_STATE_RENDER_MESSAGE_NAME, TOOL_STATUS } from '@/constants';

// Types
import type { CopilotContentPart, CopilotUserMessage } from '@/types';

/* Returns true while a CopilotKit tool call is still running (not yet complete). */
export const isToolPending = (status: string): boolean =>
  status === TOOL_STATUS.IN_PROGRESS || status === TOOL_STATUS.EXECUTING;

/* False only for CopilotKit's synthetic "coagent-state-render" placeholder message. */
export const isRealConversationMessage = (message: unknown): boolean =>
  typeof message !== 'object' ||
  message === null ||
  !('name' in message) ||
  message.name !== COAGENT_STATE_RENDER_MESSAGE_NAME;

/* Type guard — narrows an unknown CopilotKit message to a user message. */
export const isUserMessage = (message: unknown): message is CopilotUserMessage =>
  typeof message === 'object' &&
  message !== null &&
  'role' in message &&
  (message as { role: unknown }).role === CHAT_ROLE.USER;

/* Extracts plain text from a CopilotKit message content (string or ContentPart array). */
export const extractCopilotText = (content: string | CopilotContentPart[]): string => {
  if (typeof content === 'string') return content;

  return content.find((part) => part.type === 'text')?.text ?? '';
};
