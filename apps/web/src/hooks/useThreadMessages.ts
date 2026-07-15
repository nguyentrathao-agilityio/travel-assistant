import { useState, useEffect } from 'react';

// Lib
import { mastraClient } from '@/lib';

// Constants
import { AGENT_NAME, CHAT_ROLE } from '@/constants';

// Utils
import { extractText } from '@/utils';

import type { MastraRawMessage } from '@/types';

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const toThreadMessage = (raw: MastraRawMessage): ThreadMessage => ({
  id: raw.id,
  role: raw.role as ThreadMessage['role'],
  text: extractText(raw.content),
});

const isVisibleMessage = (message: ThreadMessage): boolean =>
  (message.role === CHAT_ROLE.USER || message.role === CHAT_ROLE.ASSISTANT) &&
  message.text.trim().length > 0;

export interface UseThreadMessagesResult {
  messages: ThreadMessage[];
  loading: boolean;
}

/**
 * Fetches and parses the message history for a given Mastra thread.
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

    mastraClient
      .listThreadMessages(threadId, { agentId: AGENT_NAME })
      .then((result) => {
        if (cancelled) return;

        const rawMessages = (result as { messages?: MastraRawMessage[] }).messages ?? [];
        const visibleMessages = rawMessages.map(toThreadMessage).filter(isVisibleMessage);

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
