import { describe, expect, it, vi } from 'vitest';

import { KNOWLEDGE_NAMESPACE, KNOWLEDGE_VECTOR_WEIGHT } from '../../constants';
import type { KnowledgeDocument } from '../../schemas/knowledge';
import { searchKnowledge } from '../knowledge';

const document = (overrides: Partial<KnowledgeDocument> = {}): KnowledgeDocument => ({
  id: 'jp-visa-official:chunk:0000',
  sourceId: 'jp-visa-official',
  chunkId: 'jp-visa-official:chunk:0000',
  chunkIndex: 0,
  title: 'Japan visa and entry guidance',
  content: 'Visa and entry requirements depend on nationality.',
  sourceUrl: 'https://www.mofa.go.jp/j_info/visit/visa/index.html',
  sourceName: 'Ministry of Foreign Affairs of Japan',
  country: 'Japan',
  category: 'entry',
  updatedAt: '2026-07-31',
  validUntil: null,
  authority: 'official',
  ...overrides,
});

const item = (value: KnowledgeDocument, score: number) => ({
  namespace: KNOWLEDGE_NAMESPACE,
  key: value.chunkId,
  value,
  createdAt: new Date(),
  updatedAt: new Date(),
  score,
});

describe('searchKnowledge', () => {
  it('runs filtered hybrid retrieval and returns chunk citations', async () => {
    const search = vi.fn().mockResolvedValue([item(document(), 0.91)]);

    const result = await searchKnowledge(
      {
        query: 'What are the visa entry requirements?',
        country: 'Japan',
        category: 'entry',
        maxResults: 3,
      },
      { search } as never
    );

    expect(search).toHaveBeenCalledWith(
      KNOWLEDGE_NAMESPACE,
      expect.objectContaining({
        filter: { country: 'Japan', category: 'entry' },
        mode: 'hybrid',
        vectorWeight: KNOWLEDGE_VECTOR_WEIGHT,
      })
    );
    expect(result.retrieval.strategy).toBe('hybrid');
    expect(result.results[0].document.sourceId).toBe('jp-visa-official');
    expect(result.results[0].citation).toContain('mofa.go.jp');
  });

  it('falls back to lexical retrieval when hybrid retrieval fails', async () => {
    const search = vi
      .fn()
      .mockRejectedValueOnce(new Error('embedding provider unavailable'))
      .mockResolvedValueOnce([item(document(), 0.8)]);

    const result = await searchKnowledge(
      { query: 'Japan visa rules', country: 'Japan', maxResults: 3 },
      { search } as never
    );

    expect(search).toHaveBeenLastCalledWith(
      KNOWLEDGE_NAMESPACE,
      expect.objectContaining({ mode: 'text' })
    );
    expect(result.retrieval.strategy).toBe('lexical-fallback');
  });

  it('rejects low-score, expired, and wrong-city chunks', async () => {
    const search = vi
      .fn()
      .mockResolvedValue([
        item(document({ id: 'low', chunkId: 'low' }), 0.1),
        item(document({ id: 'expired', chunkId: 'expired', validUntil: '2020-01-01' }), 0.9),
        item(document({ id: 'city', chunkId: 'city', city: 'Tokyo' }), 0.9),
        item(document({ id: 'country', chunkId: 'country' }), 0.85),
      ]);

    const result = await searchKnowledge(
      {
        query: 'Japan practical planning',
        country: 'Japan',
        city: 'Osaka',
        maxResults: 3,
      },
      { search } as never
    );

    expect(result.results.map(({ document: resultDocument }) => resultDocument.chunkId)).toEqual([
      'country',
    ]);
    expect(result.retrieval.rejectedDocuments).toBe(3);
  });
});
