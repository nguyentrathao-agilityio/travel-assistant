import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';

// Constants
import { POSTGRES_URL } from '@/constants';

/** Shared Postgres store for user preferences. */
export const memoryStore = PostgresStore.fromConnString(POSTGRES_URL!);
