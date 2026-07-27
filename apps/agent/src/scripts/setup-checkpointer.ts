import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

import { POSTGRES_URL } from '@langgraph/constants';

/**
 * One-time migration: creates/updates the checkpoint tables in Postgres.
 * Run via `pnpm db:setup` after provisioning a new database, or after
 * upgrading `@langchain/langgraph-checkpoint-postgres` to a version with
 * new migrations. Not called from the request path (see `langgraph/agent.ts`).
 */
const setupCheckpointer = async (): Promise<void> => {
  const checkpointer = PostgresSaver.fromConnString(POSTGRES_URL!);
  await checkpointer.setup();
  await checkpointer.end();
};

await setupCheckpointer();
