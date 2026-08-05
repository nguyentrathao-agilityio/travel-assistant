import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';
import { OpenAIEmbeddings } from '@langchain/openai';

// Constants
import {
  KNOWLEDGE_EMBEDDING_DIMS,
  OPENAI_API_KEY,
  OPENAI_EMBEDDING_MODEL,
  POSTGRES_URL,
} from '@/constants';

/** Shared Postgres store for hybrid knowledge search. */
export const knowledgeStore = PostgresStore.fromConnString(POSTGRES_URL!, {
  index: {
    dims: KNOWLEDGE_EMBEDDING_DIMS,
    embed: new OpenAIEmbeddings({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_EMBEDDING_MODEL,
    }),
    fields: ['title', 'content'],
    indexType: 'hnsw',
    distanceMetric: 'cosine',
  },
});
