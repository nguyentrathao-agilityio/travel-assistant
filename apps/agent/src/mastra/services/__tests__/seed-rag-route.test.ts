import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIngestDocument, mockDeleteVectors } = vi.hoisted(() => ({
  mockIngestDocument: vi.fn(),
  mockDeleteVectors: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../ingest', () => ({
  ingestDocument: mockIngestDocument,
}));

vi.mock('../../stores', () => ({
  VECTOR_STORE_NAME: 'travelVectorStore',
  VECTOR_INDEX_NAME: 'travel_docs',
  storage: {},
  vector: {
    query: vi.fn().mockResolvedValue([]),
    upsert: vi.fn().mockResolvedValue(undefined),
    createIndex: vi.fn().mockResolvedValue(undefined),
    deleteVectors: mockDeleteVectors,
    __setLogger: vi.fn(),
  },
}));

import { seedRagDocs } from '../../routes/seed-rag';

describe('seedRagDocs', () => {
  beforeEach(() => {
    mockIngestDocument.mockReset();
    mockDeleteVectors.mockReset();
    mockIngestDocument.mockResolvedValue({ success: true, chunks: 5 });
    mockDeleteVectors.mockResolvedValue(undefined);
  });

  it('returns seeded results with no errors on success', async () => {
    const { seeded, errors } = await seedRagDocs();

    expect(seeded).toBeInstanceOf(Array);
    expect(seeded.length).toBeGreaterThan(0);
    expect(seeded[0]).toMatchObject({ filename: expect.any(String), chunks: 5 });
    expect(errors).toHaveLength(0);
  });

  it('clears existing vectors before seeding each doc', async () => {
    await seedRagDocs();

    expect(mockDeleteVectors).toHaveBeenCalledWith({
      indexName: 'travel_docs',
      filter: { filename: 'travel-guide.txt' },
    });
  });

  it('calls ingestDocument once per seed doc with correct filename', async () => {
    await seedRagDocs();

    expect(mockIngestDocument).toHaveBeenCalledTimes(1);
    expect(mockIngestDocument).toHaveBeenCalledWith(expect.any(String), 'travel-guide.txt');
  });

  it('propagates chunks count from ingestDocument', async () => {
    mockIngestDocument.mockResolvedValueOnce({ success: true, chunks: 12 });

    const { seeded } = await seedRagDocs();

    expect(seeded[0].chunks).toBe(12);
  });

  it('collects errors per doc without failing the whole batch', async () => {
    mockIngestDocument.mockRejectedValueOnce(new Error('embedding failed'));

    const { seeded, errors } = await seedRagDocs();

    expect(seeded).toHaveLength(0);
    expect(errors[0]).toMatchObject({ filename: 'travel-guide.txt', error: 'embedding failed' });
  });
});
