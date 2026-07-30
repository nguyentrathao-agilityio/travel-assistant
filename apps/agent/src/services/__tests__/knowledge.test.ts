import { afterEach, describe, expect, it } from 'vitest';

import { resetKnowledgeIndex, searchKnowledge } from '../knowledge';

const semanticEmbedder = async (texts: string[]): Promise<number[][]> =>
  texts.map((text) => {
    const normalized = text.toLowerCase();
    return [
      normalized.includes('visa') || normalized.includes('entry') ? 1 : 0,
      normalized.includes('japan') ? 1 : 0,
      normalized.includes('vietnam') ? 1 : 0,
    ];
  });

describe('searchKnowledge', () => {
  afterEach(() => resetKnowledgeIndex());

  it('combines semantic retrieval with metadata filters and citations', async () => {
    const result = await searchKnowledge(
      {
        query: 'What are the visa entry requirements?',
        country: 'Japan',
        category: 'entry',
        maxResults: 3,
      },
      semanticEmbedder
    );

    expect(result.retrieval.strategy).toBe('hybrid');
    expect(result.results[0].document.id).toBe('jp-visa-official');
    expect(result.results[0].citation).toContain('mofa.go.jp');
    expect(result.results.every(({ document }) => document.country === 'Japan')).toBe(true);
  });

  it('falls back to lexical retrieval when embeddings are unavailable', async () => {
    const result = await searchKnowledge(
      {
        query: 'transportation weather culture',
        country: 'Vietnam',
        maxResults: 3,
      },
      async () => {
        throw new Error('embedding provider unavailable');
      }
    );

    expect(result.retrieval.strategy).toBe('lexical-fallback');
    expect(result.results[0].document.id).toBe('vn-tourism-practical');
  });

  it('allows country-level guidance when a city filter is supplied', async () => {
    const result = await searchKnowledge(
      {
        query: 'Vietnam practical planning',
        country: 'Vietnam',
        city: 'Da Nang',
        category: 'planning',
        maxResults: 3,
      },
      semanticEmbedder
    );

    expect(result.results.map(({ document }) => document.id)).toContain('vn-tourism-practical');
  });
});
