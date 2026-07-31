import { z } from 'zod';

export const KnowledgeCategorySchema = z.enum([
  'entry',
  'safety',
  'transport',
  'culture',
  'planning',
]);

export const KnowledgeSearchInputSchema = z.object({
  query: z.string().min(3).describe('A focused travel knowledge question'),
  country: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  category: KnowledgeCategorySchema.optional(),
  maxResults: z.number().int().min(1).max(8).default(5),
});

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
