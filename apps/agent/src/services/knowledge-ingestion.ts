import { KNOWLEDGE_NAMESPACE } from '../constants';
import { loadKnowledgeSource, splitKnowledgeSource } from '../knowledge';
import type { KnowledgeSource } from '../schemas/knowledge';
import { knowledgeStore } from '../infrastructure/persistence';

type KnowledgeIngestionStore = Pick<typeof knowledgeStore, 'delete' | 'put' | 'search'>;
type SourceLoader = typeof loadKnowledgeSource;

export type KnowledgeIngestionResult = {
  sourceId: string;
  chunks: number;
  deletedStaleChunks: number;
};

/**
 * Loads and chunks a knowledge source, then upserts its chunks into the store. Re-ingesting a
 * source that has shrunk or been restructured can produce fewer/different chunk ids than a
 * previous run, so any chunk id from the old run that the new run didn't reproduce is deleted —
 * otherwise stale chunks would linger in the store indefinitely.
 */
export const ingestKnowledgeSource = async (
  source: KnowledgeSource,
  store: KnowledgeIngestionStore = knowledgeStore,
  loader: SourceLoader = loadKnowledgeSource
): Promise<KnowledgeIngestionResult> => {
  const content = await loader(source);
  const chunks = await splitKnowledgeSource(source, content);
  const existing = await store.search(KNOWLEDGE_NAMESPACE, {
    filter: { sourceId: source.id },
    limit: 10_000,
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
