import { afterEach, describe, expect, it, vi } from 'vitest';

const searchKnowledgeMock = vi.fn();

vi.mock('../../knowledge', () => ({
  searchKnowledge: (...args: unknown[]) => searchKnowledgeMock(...args),
}));

import { knowledgeSearchTool } from '../knowledge';

const input = {
  query: 'What are the visa entry requirements?',
  country: 'Japan',
  category: 'entry' as const,
  maxResults: 5,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('knowledgeSearchTool', () => {
  it('returns the stringified search result on success', async () => {
    const searchResult = {
      query: input.query,
      results: [
        {
          document: {
            id: 'jp-visa-official',
            title: 'Japan visa and entry guidance',
            content: 'Verify current official guidance before booking.',
            sourceUrl: 'https://www.mofa.go.jp/j_info/visit/visa/index.html',
            sourceName: 'Ministry of Foreign Affairs of Japan',
            country: 'Japan',
            category: 'entry',
            updatedAt: '2026-07-30',
            validUntil: null,
            authority: 'official',
          },
          score: 0.9,
          citation:
            '[Ministry of Foreign Affairs of Japan](https://www.mofa.go.jp/j_info/visit/visa/index.html)',
        },
      ],
      retrieval: { strategy: 'hybrid', searchedDocuments: 1 },
    };
    searchKnowledgeMock.mockResolvedValueOnce(searchResult);

    const result = JSON.parse(await knowledgeSearchTool.invoke(input));

    expect(searchKnowledgeMock).toHaveBeenCalledWith(input);
    expect(result).toEqual(searchResult);
  });

  it('returns a JSON error payload when searchKnowledge throws an Error', async () => {
    searchKnowledgeMock.mockRejectedValueOnce(new Error('embedding provider unavailable'));

    const result = JSON.parse(await knowledgeSearchTool.invoke(input));

    expect(result).toEqual(
      expect.objectContaining({
        error: 'embedding provider unavailable',
        code: 'PROVIDER_UNAVAILABLE',
        provider: 'knowledge-store',
      })
    );
  });

  it('falls back to the generic knowledge error message for a non-Error throw', async () => {
    searchKnowledgeMock.mockRejectedValueOnce('boom');

    const result = JSON.parse(await knowledgeSearchTool.invoke(input));

    expect(result).toEqual(
      expect.objectContaining({
        error: "Couldn't search the knowledge base right now. Please try again.",
      })
    );
  });
});
