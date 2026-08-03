import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';

import { POSTGRES_URL } from '../../constants';

export const memoryStore = PostgresStore.fromConnString(POSTGRES_URL!);
