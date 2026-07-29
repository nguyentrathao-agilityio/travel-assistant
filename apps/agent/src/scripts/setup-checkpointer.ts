import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';

import { POSTGRES_URL } from '../constants';

/**
 * One-time migration: creates/updates the checkpoint and long-term-memory
 * store tables in Postgres. Run via `pnpm db:setup` after provisioning a new
 * database, or after upgrading `@langchain/langgraph-checkpoint-postgres` to
 * a version with new migrations. Not called from the request path (see
 * `agent.ts` / `nodes/branches.ts`).
 */
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
