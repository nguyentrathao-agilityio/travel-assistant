// Schemas
import { KnowledgeDocumentSchema } from '@/schemas/knowledge';
import type {
  KnowledgeDocument,
  KnowledgeSearchInput,
  KnowledgeSearchResult,
} from '@/schemas/knowledge';

// Constants
import {
  KNOWLEDGE_CANDIDATE_MULTIPLIER,
  KNOWLEDGE_MIN_CANDIDATES,
  KNOWLEDGE_MIN_SCORE,
  KNOWLEDGE_NAMESPACE,
  KNOWLEDGE_VECTOR_WEIGHT,
} from '@/constants';

// Infrastructure
import { knowledgeStore } from '@/infrastructure/persistence';

type KnowledgeStoreLike = Pick<typeof knowledgeStore, 'search'>;

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

// Country-level chunks intentionally have no city and remain valid for city-specific questions.
const matchesOptionalFields = (
  document: KnowledgeDocument,
  input: KnowledgeSearchInput
): boolean => {
  const isCurrent =
    !document.validUntil || document.validUntil >= new Date().toISOString().slice(0, 10);
  const cityMatches =
    !document.city || !input.city || normalize(document.city) === normalize(input.city);
  return isCurrent && cityMatches;
};

export const searchKnowledge = async (
  input: KnowledgeSearchInput,
  store: KnowledgeStoreLike = knowledgeStore
): Promise<KnowledgeSearchResult> => {
  const filter: Record<string, string> = {};
  if (input.country) filter.country = input.country;
  if (input.category) filter.category = input.category;

  const limit = Math.max(
    input.maxResults * KNOWLEDGE_CANDIDATE_MULTIPLIER,
    KNOWLEDGE_MIN_CANDIDATES
  );

  let strategy: KnowledgeSearchResult['retrieval']['strategy'] = 'hybrid';
  let items;
  try {
    items = await store.search(KNOWLEDGE_NAMESPACE, {
      query: input.query,
      filter,
      mode: 'hybrid',
      vectorWeight: KNOWLEDGE_VECTOR_WEIGHT,
      similarityThreshold: KNOWLEDGE_MIN_SCORE,
      limit,
    });
  } catch {
    strategy = 'lexical-fallback';
    items = await store.search(KNOWLEDGE_NAMESPACE, {
      query: input.query,
      filter,
      mode: 'text',
      limit,
    });
  }

  let rejectedDocuments = 0;
  const acceptedResults: KnowledgeSearchResult['results'] = [];
  for (const item of items) {
    const score = item.score ?? 0;
    const parsed = KnowledgeDocumentSchema.safeParse(item.value);
    if (
      !parsed.success ||
      score < KNOWLEDGE_MIN_SCORE ||
      !matchesOptionalFields(parsed.data, input)
    ) {
      rejectedDocuments += 1;
      continue;
    }
    acceptedResults.push({
      document: parsed.data,
      score: Number(score.toFixed(4)),
      citation: `[${parsed.data.sourceName}](${parsed.data.sourceUrl})`,
    });
  }

  const ranked = acceptedResults
    .sort((left, right) => right.score - left.score)
    .slice(0, input.maxResults);

  return {
    query: input.query,
    results: ranked,
    retrieval: {
      strategy,
      searchedDocuments: items.length,
      rejectedDocuments,
    },
  };
};
