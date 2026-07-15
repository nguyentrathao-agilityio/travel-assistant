import { CHAT_ROLE } from '@/constants';
import type {
  MastraTextPart,
  MastraMessageContent,
  MastraToolInvocationPart,
  MastraRawMessage,
  AgUiMessage,
  AgUiAssistantMessage,
} from '@/types';

export const extractText = (content: MastraMessageContent | string): string => {
  if (typeof content === 'string') return content;

  return (content.parts ?? [])
    .filter((part): part is MastraTextPart => part.type === 'text' && 'text' in part && !!part.text)
    .map((part) => part.text)
    .join('');
};

export const extractToolInvocations = (
  content: MastraMessageContent | string
): MastraToolInvocationPart['toolInvocation'][] => {
  if (typeof content === 'string') return [];
  return (content.parts ?? [])
    .filter((part): part is MastraToolInvocationPart => part.type === 'tool-invocation')
    .map((part) => part.toolInvocation);
};

export const toAgUiMessages = (raw: MastraRawMessage): AgUiMessage[] => {
  const out: AgUiMessage[] = [];

  if (raw.role === CHAT_ROLE.USER) {
    const text = extractText(raw.content);
    if (text.trim()) out.push({ id: raw.id, role: CHAT_ROLE.USER, content: text });
    return out;
  }

  if (raw.role === CHAT_ROLE.ASSISTANT) {
    const invocations = extractToolInvocations(raw.content);
    const text = extractText(raw.content);

    const toolCalls = invocations.length
      ? invocations.map((inv) => ({
          id: inv.toolCallId,
          type: 'function' as const,
          function: { name: inv.toolName, arguments: JSON.stringify(inv.args ?? {}) },
        }))
      : undefined;

    if (text.trim() || toolCalls) {
      const msg: AgUiAssistantMessage = { id: raw.id, role: CHAT_ROLE.ASSISTANT };
      if (text.trim()) msg.content = text;
      if (toolCalls) msg.toolCalls = toolCalls;
      out.push(msg);
    }

    for (const inv of invocations) {
      if (inv.state === 'result' && inv.result) {
        out.push({
          id: `tool-result::${inv.toolCallId}`,
          role: CHAT_ROLE.TOOL,
          toolCallId: inv.toolCallId,
          content: typeof inv.result === 'string' ? inv.result : JSON.stringify(inv.result),
        });
      }
    }
  }

  return out;
};

export const deduplicateHitlResends = (rawMessages: MastraRawMessage[]): MastraRawMessage[] => {
  const toolCallIdsWithResult = new Set<string>();
  for (const raw of rawMessages) {
    if (raw.role === CHAT_ROLE.ASSISTANT) {
      for (const inv of extractToolInvocations(raw.content)) {
        if (inv.state === 'result') toolCallIdsWithResult.add(inv.toolCallId);
      }
    }
  }

  const seenUserContent = new Set<string>();
  const seenAssistantText = new Set<string>();

  return rawMessages.filter((raw, i) => {
    if (raw.role === CHAT_ROLE.USER) {
      const text = extractText(raw.content);
      const prev = rawMessages[i - 1];
      const isHitlReSend = seenUserContent.has(text) && prev?.role === CHAT_ROLE.ASSISTANT;
      seenUserContent.add(text);
      return !isHitlReSend;
    }

    if (raw.role === CHAT_ROLE.ASSISTANT) {
      const invocations = extractToolInvocations(raw.content);
      const isSuperseded =
        invocations.length > 0 &&
        invocations.every(
          (inv) => inv.state === 'call' && toolCallIdsWithResult.has(inv.toolCallId)
        );
      if (isSuperseded) return false;

      const text = extractText(raw.content).trim();
      if (text) {
        if (seenAssistantText.has(text)) return false;
        seenAssistantText.add(text);
      }
    }

    return true;
  });
};
