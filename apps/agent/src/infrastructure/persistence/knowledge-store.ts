import { PostgresStore } from '@langchain/langgraph-checkpoint-postgres/store';
import { OpenAIEmbeddings } from '@langchain/openai';

import {
  KNOWLEDGE_EMBEDDING_DIMS,
  OPENAI_API_KEY,
  OPENAI_EMBEDDING_MODEL,
  POSTGRES_URL,
} from '../../constants';

/** Shared Postgres-backed vector store for the RAG knowledge base — hybrid semantic + lexical search over title/content. */
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
