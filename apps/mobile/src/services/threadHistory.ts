import type { Message, Thread } from '@langchain/langgraph-sdk';

// Constants
import { AGENT_NAME, GRAPH_ID } from '@repo/constants';

// Utils
import { generateThreadId } from './generateThreadId';
import { getLanggraphClient } from './langgraphClient';

export interface ThreadItem {
  id: string;
  title: string | null;
  createdAt: string;
}

export const findEmptyThreadId = (threads: ThreadItem[]): string | null =>
  threads.find((thread) => thread.title === null)?.id ?? null;

export const keepNewestEmptyThread = (threads: ThreadItem[]): ThreadItem[] => {
  let hasKeptEmptyThread = false;

  return threads.filter((thread) => {
    if (thread.title !== null) return true;
    if (hasKeptEmptyThread) return false;

    hasKeptEmptyThread = true;
    return true;
  });
};

export const RECENT_THREADS_LIMIT = 5;

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

const customTitle = (metadata: Thread['metadata']): string | null => {
  const value = (metadata as { customTitle?: unknown } | undefined)?.customTitle;

  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

export const toThreadItem = (thread: Thread): ThreadItem => {
  const { messages } = (thread.values as { messages?: Message[] } | undefined) ?? {};

  return {
    id: thread.thread_id,
    title: customTitle(thread.metadata) ?? firstHumanMessageText(messages),
    createdAt: thread.created_at,
  };
};

export const fetchRecentThreads = async (
  limit: number = RECENT_THREADS_LIMIT
): Promise<ThreadItem[]> => {
  const threads = await getLanggraphClient().threads.search({
    metadata: { resourceId: AGENT_NAME },
    limit,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  return keepNewestEmptyThread(threads.map(toThreadItem));
};

// Paginated variant for the "All trips" screen — mirrors web's searchThreadsPage.
export const fetchThreadsPage = async (limit: number, offset: number): Promise<ThreadItem[]> => {
  const threads = await getLanggraphClient().threads.search({
    metadata: { resourceId: AGENT_NAME },
    limit,
    offset,
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

// Keeps resourceId so the thread stays discoverable by fetchRecentThreads/fetchThreadsPage's search filter.
export const renameRemoteThread = (threadId: string, title: string): Promise<void> =>
  getLanggraphClient()
    .threads.update(threadId, {
      metadata: { resourceId: AGENT_NAME, customTitle: title.trim() },
    })
    .then(() => undefined);

// Deletes `threadId` and creates a fresh one in its place — mirrors web's `resetThread`.
export const resetRemoteThread = async (threadId: string): Promise<string> => {
  const newThreadId = generateThreadId();

  await getLanggraphClient().threads.delete(threadId);
  await createRemoteThread(newThreadId);

  return newThreadId;
};
