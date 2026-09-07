import { AGENT_NAME, GRAPH_ID } from '@repo/constants';

import { generateThreadId } from './generateThreadId';
import { getLanggraphClient } from './langgraphClient';

import type { Message, Thread } from '@langchain/langgraph-sdk';

export interface ThreadItem {
  id: string;
  title: string | null;
  createdAt: string;
}

const RECENT_THREADS_LIMIT = 5;

const messageText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .filter(
      (part): part is { type: 'text'; text: string } =>
        typeof part === 'object' &&
        part !== null &&
        'type' in part &&
        part.type === 'text' &&
        'text' in part &&
        typeof part.text === 'string'
    )
    .map((part) => part.text)
    .join('');
};

export const firstHumanMessageText = (messages: Message[] | undefined): string | null => {
  for (const message of messages ?? []) {
    if (message.type !== 'human') continue;
    const text = messageText(message.content).trim();

    if (text) return text;
  }

  return null;
};

export const toThreadItem = (thread: Thread): ThreadItem => {
  const { messages } = (thread.values as { messages?: Message[] } | undefined) ?? {};

  return {
    id: thread.thread_id,
    title: firstHumanMessageText(messages),
    createdAt: thread.created_at,
  };
};

export const fetchRecentThreads = async (): Promise<ThreadItem[]> => {
  const threads = await getLanggraphClient().threads.search({
    metadata: { resourceId: AGENT_NAME },
    limit: RECENT_THREADS_LIMIT,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  return threads.map(toThreadItem);
};

export const createRemoteThread = (threadId: string): Promise<Thread> =>
  getLanggraphClient().threads.create({
    threadId,
    graphId: GRAPH_ID,
    ifExists: 'do_nothing',
    metadata: { resourceId: AGENT_NAME },
  });

// The thread's last checkpointed graph state — used to hydrate `agent.state` on cold start.
export const fetchThreadValues = async (
  threadId: string
): Promise<Record<string, unknown> | undefined> => {
  const thread = await getLanggraphClient().threads.get(threadId);

  return thread.values as Record<string, unknown> | undefined;
};

export const deleteRemoteThread = (threadId: string): Promise<void> =>
  getLanggraphClient().threads.delete(threadId);

// Deletes `threadId` and creates a fresh one in its place — mirrors web's `resetThread`.
export const resetRemoteThread = async (threadId: string): Promise<string> => {
  const newThreadId = generateThreadId();

  await getLanggraphClient().threads.delete(threadId);
  await createRemoteThread(newThreadId);

  return newThreadId;
};
