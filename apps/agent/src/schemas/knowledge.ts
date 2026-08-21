import { z } from 'zod';

// Utils
import { stripNulls } from '@/utils/schema';

export const KnowledgeCategorySchema = z.enum([
  'entry',
  'safety',
  'transport',
  'culture',
  'planning',
]);

/** Treats a model-generated empty string the same as an omitted optional field. */
const stripEmptyOptionalStrings = (raw: unknown): unknown => {
  const withoutNulls = stripNulls(raw);

  if (withoutNulls && typeof withoutNulls === 'object' && !Array.isArray(withoutNulls)) {
    return Object.fromEntries(
      Object.entries(withoutNulls as Record<string, unknown>).map(([k, v]) => [
        k,
        v === '' ? undefined : v,
      ])
    );
  }

  return withoutNulls;
};

export const KnowledgeSearchInputSchema = z.preprocess(
  stripEmptyOptionalStrings,
  z.object({
    query: z.string().min(3).describe('A focused travel knowledge question'),
    country: z.string().min(2).optional(),
    city: z.string().min(2).optional(),
    category: KnowledgeCategorySchema.optional(),
    maxResults: z.number().int().min(1).max(8).default(5),
  })
);

export type KnowledgeSearchInput = z.infer<typeof KnowledgeSearchInputSchema>;

export const KnowledgeSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceUrl: z.string().url(),
  sourceName: z.string(),
  country: z.string().optional(),
  city: z.string().optional(),
  category: KnowledgeCategorySchema,
  updatedAt: z.string(),
  validUntil: z.string().nullable().default(null),
  authority: z.enum(['official', 'curated']),
});

export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;

export const KnowledgeDocumentSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  chunkId: z.string(),
  chunkIndex: z.number().int().nonnegative(),
  title: z.string(),
  content: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceName: z.string(),
  country: z.string().optional(),
  city: z.string().optional(),
  category: KnowledgeCategorySchema,
  updatedAt: z.string(),
  validUntil: z.string().nullable().default(null),
  authority: z.enum(['official', 'curated']),
});

export type KnowledgeDocument = z.infer<typeof KnowledgeDocumentSchema>;

export const KnowledgeSearchResultSchema = z.object({
  query: z.string(),
  results: z.array(
    z.object({
      document: KnowledgeDocumentSchema,
      score: z.number(),
      citation: z.string(),
    })
  ),
  retrieval: z.object({
    strategy: z.enum(['hybrid', 'lexical-fallback']),
    searchedDocuments: z.number().int(),
    rejectedDocuments: z.number().int(),
  }),
});

export type KnowledgeSearchResult = z.infer<typeof KnowledgeSearchResultSchema>;
