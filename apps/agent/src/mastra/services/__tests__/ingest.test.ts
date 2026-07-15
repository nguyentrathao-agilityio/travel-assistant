import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock functions so they are available inside the vi.mock factory below.
const { mockUpsert, mockQuery } = vi.hoisted(() => ({
  mockUpsert: vi.fn().mockResolvedValue(undefined),
  mockQuery: vi.fn().mockResolvedValue([]),
}));

// VectorMock: replace the stores module with deterministic stubs.
// PgVector speaks native PostgreSQL, not HTTP, so AIMock's VectorMock HTTP server
// cannot intercept it. Mocking stores directly gives the same guarantee:
// no DB connection, deterministic outcomes, verifiable call assertions.
vi.mock('../../stores', () => ({
  VECTOR_STORE_NAME: 'travelVectorStore',
  VECTOR_INDEX_NAME: 'travel_docs',
  storage: {},
  vector: {
    query: mockQuery,
    upsert: mockUpsert,
    createIndex: vi.fn().mockResolvedValue(undefined),
    deleteVectors: vi.fn().mockResolvedValue(undefined),
  },
}));

// Stub embedMany so each chunk gets a deterministic fixed-length vector without
// hitting the OpenAI embeddings endpoint.
vi.mock('ai', async (importOriginal) => {
  const mod = await importOriginal<typeof import('ai')>();
  return {
    ...mod,
    embedMany: vi.fn().mockImplementation(async ({ values }: { values: string[] }) => ({
      embeddings: values.map(() => [0.1, 0.2, 0.3, 0.4, 0.5]),
      usage: { inputTokens: values.length, totalTokens: values.length },
    })),
  };
});

import { ingestDocument } from '../../ingest';

describe('ingestDocument', () => {
  beforeEach(() => {
    mockUpsert.mockClear();
  });

  it('upserts chunks into the travel_docs index', async () => {
    const result = await ingestDocument(
      'Vietnam has beautiful beaches and ancient temples worth visiting.',
      'vietnam-guide.pdf'
    );

    expect(result.success).toBe(true);
    expect(result.chunks).toBeGreaterThan(0);
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ indexName: 'travel_docs' }));
  });

  it('tags every chunk with the source filename in metadata', async () => {
    await ingestDocument('Short content for filename tagging.', 'tagged.pdf');

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.arrayContaining([expect.objectContaining({ filename: 'tagged.pdf' })]),
      })
    );
  });

  it('upserts one vector per document chunk', async () => {
    const result = await ingestDocument('Brief content for chunk count verification.', 'count.pdf');

    const params = mockUpsert.mock.calls[0][0] as {
      vectors: number[][];
      metadata: unknown[];
    };
    expect(params.vectors.length).toBe(params.metadata.length);
    expect(result.chunks).toBe(params.vectors.length);
  });
});
