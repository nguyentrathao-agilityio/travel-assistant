import { describe, expect, it, vi } from 'vitest';

// Constants
import { KNOWLEDGE_NAMESPACE } from '@/constants';

// Schemas
import type { KnowledgeSource } from '@/schemas/knowledge';

// Knowledge
import { ingestKnowledgeSource } from '@/knowledge/ingestion';

const source: KnowledgeSource = {
  id: 'official-guide',
  title: 'Official travel guide',
  sourceUrl: 'https://example.gov/guide',
  sourceName: 'Example Authority',
  category: 'planning',
  updatedAt: '2026-07-31',
  validUntil: null,
  authority: 'official',
};

describe('ingestKnowledgeSource', () => {
  it('upserts current chunks and deletes stale chunks from the same source', async () => {
    const search = vi
      .fn()
      .mockResolvedValue([
        { key: 'official-guide:chunk:0000' },
        { key: 'official-guide:chunk:stale' },
      ]);
    const put = vi.fn().mockResolvedValue(undefined);
    const deleteItem = vi.fn().mockResolvedValue(undefined);
    const content = 'Official planning and entry guidance. '.repeat(40);

    const result = await ingestKnowledgeSource(
      source,
      { search, put, delete: deleteItem } as never,
      vi.fn().mockResolvedValue(content)
    );

    expect(search).toHaveBeenCalledWith(KNOWLEDGE_NAMESPACE, {
      filter: { sourceId: source.id },
      limit: 10_000,
    });
    expect(put).toHaveBeenCalled();
    expect(deleteItem).toHaveBeenCalledWith(KNOWLEDGE_NAMESPACE, 'official-guide:chunk:stale');
    expect(result.chunks).toBeGreaterThan(0);
    expect(result.deletedStaleChunks).toBe(1);
  });
});
