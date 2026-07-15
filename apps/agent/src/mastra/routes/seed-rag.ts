import { registerApiRoute } from '@mastra/core/server';
import { ingestDocument } from '../ingest';
import { vector, VECTOR_INDEX_NAME } from '../stores';
import { RAG_SEED_DOCS } from '@/constants';

export type SeedResult = { filename: string; chunks: number };
export type SeedError = { filename: string; error: string };

/** Seeds all RAG documents into the vector store.
 *  Clears existing vectors per filename first — safe to call multiple times. */
export const seedRagDocs = async (): Promise<{ seeded: SeedResult[]; errors: SeedError[] }> => {
  const seeded: SeedResult[] = [];
  const errors: SeedError[] = [];

  await vector.createIndex({ indexName: VECTOR_INDEX_NAME, dimension: 1536 }).catch(() => {});

  for (const doc of RAG_SEED_DOCS) {
    try {
      await vector.deleteVectors({
        indexName: VECTOR_INDEX_NAME,
        filter: { filename: doc.filename },
      });
      const result = await ingestDocument(doc.content, doc.filename);
      seeded.push({ filename: doc.filename, chunks: result.chunks });
    } catch (err) {
      errors.push({
        filename: doc.filename,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { seeded, errors };
};

export const seedRagRoute = registerApiRoute('/admin/seed-rag', {
  method: 'POST',
  handler: async (c) => {
    const result = await seedRagDocs();
    const allFailed = result.errors.length > 0 && result.seeded.length === 0;
    return c.json(result, allFailed ? 500 : 200);
  },
});
