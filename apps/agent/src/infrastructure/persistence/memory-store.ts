import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';

import { POSTGRES_URL } from '../../constants';

/** Shared Postgres-backed store for durable user-preference memories (see services/memory.ts). */
export const memoryStore = PostgresStore.fromConnString(POSTGRES_URL!);
