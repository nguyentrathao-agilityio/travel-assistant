import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';

// Constants
import { POSTGRES_URL } from '@/constants';

// Infrastructure
import { knowledgeStore } from '@/infrastructure/persistence';

/** Runs checkpoint and memory-store migrations outside the request path. */
const setupCheckpointer = async (): Promise<void> => {
  const checkpointer = PostgresSaver.fromConnString(POSTGRES_URL!);

  await checkpointer.setup();
  await checkpointer.end();
};

const setupStore = async (): Promise<void> => {
  const store = PostgresStore.fromConnString(POSTGRES_URL!);

  await store.setup();
  await store.stop();
};

await setupCheckpointer();
await setupStore();
await knowledgeStore.setup();
await knowledgeStore.stop();
