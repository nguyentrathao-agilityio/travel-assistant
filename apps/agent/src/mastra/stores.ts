import { PostgresStore, PgVector } from '@mastra/pg';

export const VECTOR_STORE_NAME = 'travelVectorStore';
export const VECTOR_INDEX_NAME = 'travel_docs';

export const storage = new PostgresStore({
  id: 'mastra-storage',
  connectionString: process.env.POSTGRES_URL!,
});

export const vector = new PgVector({
  id: 'mastra-vector',
  connectionString: process.env.POSTGRES_URL!,
});
