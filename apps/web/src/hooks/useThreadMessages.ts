import { useState, useEffect } from 'react';

// Lib
import { langgraphClient } from '@/lib';

// Constants
import { CHAT_ROLE } from '@/constants';

// Utils
import { langgraphMessageText } from '@/utils';

import type { LangGraphRawMessage } from '@/utils';

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const toThreadMessage = (raw: LangGraphRawMessage, fallbackId: string): ThreadMessage => {
  const role = raw.role ?? raw.type ?? '';
  return {
    id: raw.id ?? fallbackId,
    role: role === 'human' ? CHAT_ROLE.USER : (role as ThreadMessage['role']),
    text: langgraphMessageText(raw.content),
  };
};

const isVisibleMessage = (message: ThreadMessage): boolean =>
  (message.role === CHAT_ROLE.USER || message.role === CHAT_ROLE.ASSISTANT) &&
  message.text.trim().length > 0;

export interface UseThreadMessagesResult {
  messages: ThreadMessage[];
  loading: boolean;
}

/**
 * Fetches and parses the message history for a given LangGraph thread checkpoint.
 * Returns only user/assistant messages with non-empty text (tool messages are excluded).
 *
 * Resets and re-fetches automatically when `threadId` changes.
 */
export const useThreadMessages = (threadId: string | null): UseThreadMessagesResult => {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    // Guard against race conditions when threadId changes before the fetch resolves.
    let cancelled = false;
    setLoading(true);

    langgraphClient.threads
      .getState<{ messages?: LangGraphRawMessage[] }>(threadId)
      .then((state) => {
        if (cancelled) return;

        const rawMessages = state.values.messages ?? [];
        const visibleMessages = rawMessages
          .map((raw, index) => toThreadMessage(raw, `${threadId}:${index}`))
          .filter(isVisibleMessage);

        setMessages(visibleMessages);
      })
      .catch(() => setMessages([]))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  return { messages, loading };
};
