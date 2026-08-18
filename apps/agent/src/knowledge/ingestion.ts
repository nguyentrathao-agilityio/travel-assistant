// Constants
import { KNOWLEDGE_NAMESPACE, KNOWLEDGE_STALE_CHUNK_SEARCH_LIMIT } from '@/constants';

// Infrastructure
import { knowledgeStore } from '@/infrastructure/persistence';

// Knowledge
import { loadKnowledgeSource, splitKnowledgeSource } from './loader';

// Schemas
import type { KnowledgeSource } from '@/schemas';

type KnowledgeIngestionStore = Pick<typeof knowledgeStore, 'delete' | 'put' | 'search'>;
type SourceLoader = typeof loadKnowledgeSource;

export type KnowledgeIngestionResult = {
  sourceId: string;
  chunks: number;
  deletedStaleChunks: number;
};

/** Upserts source chunks and removes stale chunks left by previous ingestions. */
export const ingestKnowledgeSource = async (
  source: KnowledgeSource,
  store: KnowledgeIngestionStore = knowledgeStore,
  loader: SourceLoader = loadKnowledgeSource
): Promise<KnowledgeIngestionResult> => {
  const content = await loader(source);
  const chunks = await splitKnowledgeSource(source, content);
  const existing = await store.search(KNOWLEDGE_NAMESPACE, {
    filter: { sourceId: source.id },
    limit: KNOWLEDGE_STALE_CHUNK_SEARCH_LIMIT,
  });
  const currentChunkIds = new Set(chunks.map((chunk) => chunk.chunkId));
  const staleChunkIds = existing.map((item) => item.key).filter((key) => !currentChunkIds.has(key));

  for (const chunk of chunks) {
    await store.put(KNOWLEDGE_NAMESPACE, chunk.chunkId, chunk);
  }

  for (const chunkId of staleChunkIds) {
    await store.delete(KNOWLEDGE_NAMESPACE, chunkId);
  }

  return {
    sourceId: source.id,
    chunks: chunks.length,
    deletedStaleChunks: staleChunkIds.length,
  };
};
