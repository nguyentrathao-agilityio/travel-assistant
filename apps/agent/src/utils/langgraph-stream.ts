// Constants
import { LANGGRAPH_MESSAGE_TYPES } from '@/constants';

import { isRecord } from './object';

export type LangGraphStreamMessage = {
  type?: string;
  content?: unknown;
  tool_calls?: Array<{ id?: string; name: string; args?: Record<string, unknown> }>;
  tool_call_id?: string;
  name?: string;
};

/** Joins the text parts of a LangGraph message `content`. */
export const messageContentText = (content: unknown): string => {
  if (typeof content === 'string') return content;

  if (!Array.isArray(content)) return '';

  return content
    .map((part) => (isRecord(part) && 'text' in part ? String(part.text) : ''))
    .join('');
};

/** True for an AI message or a streamed AI message chunk. */
export const isAiMessage = (message: LangGraphStreamMessage): boolean =>
  message.type === LANGGRAPH_MESSAGE_TYPES.AI || message.type === LANGGRAPH_MESSAGE_TYPES.AI_CHUNK;

/** Splits a stream event name ("messages|plan:<id>|…") into its kind, namespace and top node. */
export const parseStreamEvent = (event: string) => {
  const [kind = '', ...namespace] = event.split('|');

  return { kind, namespace, topNode: namespace[0]?.split(':')[0] ?? '' };
};
