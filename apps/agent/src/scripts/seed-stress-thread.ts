import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';

import { Client } from '@langchain/langgraph-sdk';

// Constants
import { AGENT_NAME, GRAPH_ID } from '@repo/constants';
import { LANGGRAPH_DEPLOYMENT_URL } from '@/constants';

// Infrastructure
import { setupTranscriptStore, transcriptStore } from '@/infrastructure/persistence';

// Scripts
import { buildStressTranscript } from './stress-transcript';

import type { TranscriptMessage } from '@repo/schemas';

// Messages kept in the checkpoint, mirroring what summarization leaves after compaction.
const CHECKPOINT_MESSAGE_COUNT = 10;
const FINAL_NODE = 'saveMemory';
const EXPO_GO_DEV_URL = 'exp://127.0.0.1:8081';

const toLangGraphMessage = (message: TranscriptMessage) => ({
  id: message.id,
  type: message.role === 'user' ? 'human' : message.role === 'assistant' ? 'ai' : 'tool',
  content: message.content,
  ...(message.toolCalls ? { tool_calls: message.toolCalls } : {}),
  ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
});

// Starts the checkpoint slice on a user message so no tool result loses its call.
const checkpointMessages = (messages: TranscriptMessage[]): TranscriptMessage[] => {
  const tail = messages.slice(-CHECKPOINT_MESSAGE_COUNT);
  const firstUser = tail.findIndex((message) => message.role === 'user');

  return firstUser === -1 ? [] : tail.slice(firstUser);
};

const seed = async (count: number): Promise<void> => {
  const client = new Client({ apiUrl: LANGGRAPH_DEPLOYMENT_URL });
  const threadId = randomUUID();
  const messages = buildStressTranscript(count);

  await setupTranscriptStore();
  await transcriptStore.appendMissing(threadId, messages);
  await client.threads.create({
    threadId,
    graphId: GRAPH_ID,
    metadata: { resourceId: AGENT_NAME, purpose: 'stress-test', messageCount: count },
  });
  await client.threads.updateState(threadId, {
    values: { messages: checkpointMessages(messages).map(toLangGraphMessage) },
    asNode: FINAL_NODE,
  });

  console.log(`[stress] seeded ${count} messages`);
  console.log(`threadId=${threadId}`);
  console.log(`expoGo=${EXPO_GO_DEV_URL}/--/chat?threadId=${threadId}`);
  console.log(`app=travelplanner://chat?threadId=${threadId}`);
};

const remove = async (threadId: string): Promise<void> => {
  const client = new Client({ apiUrl: LANGGRAPH_DEPLOYMENT_URL });

  await transcriptStore.deleteThread(threadId);
  await client.threads.delete(threadId).catch(() => undefined);
  console.log(`[stress] deleted ${threadId}`);
};

/** Seeds (`--count N`) or deletes (`--delete <threadId>`) a stress-test chat thread. */
const main = async (): Promise<void> => {
  const { values } = parseArgs({
    options: { count: { type: 'string' }, delete: { type: 'string' } },
  });

  if (values.delete) return remove(values.delete);

  const count = Number(values.count);

  if (!Number.isInteger(count) || count < 1) throw new Error('Pass --count <positive integer>.');

  await seed(count);
};

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[stress] failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
