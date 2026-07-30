import { getOpenAIClient } from '../llm';
import { KNOWLEDGE_CORPUS } from '../knowledge/corpus';
import type {
  KnowledgeDocument,
  KnowledgeSearchInput,
  KnowledgeSearchResult,
} from '../schemas/knowledge';

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
const VECTOR_WEIGHT = 0.65;
const LEXICAL_WEIGHT = 0.35;

type Embedder = (texts: string[]) => Promise<number[][]>;

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const tokens = (value: string): Set<string> =>
  new Set(
    normalize(value)
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((token) => token.length > 1) ?? []
  );

const lexicalScore = (query: string, document: KnowledgeDocument): number => {
  const queryTokens = tokens(query);
  if (!queryTokens.size) return 0;
  const documentTokens = tokens(`${document.title} ${document.content}`);
  const matches = [...queryTokens].filter((token) => documentTokens.has(token)).length;
  return matches / queryTokens.size;
};

const cosineSimilarity = (left: number[], right: number[]): number => {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator ? Math.max(0, dot / denominator) : 0;
};

const defaultEmbedder: Embedder = async (texts) => {
  const response = await getOpenAIClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
};

const matchesMetadata = (document: KnowledgeDocument, input: KnowledgeSearchInput): boolean => {
  const same = (actual: string | undefined, expected: string | undefined) =>
    !expected || (actual ? normalize(actual) === normalize(expected) : false);
  const isCurrent =
    !document.validUntil || document.validUntil >= new Date().toISOString().slice(0, 10);
  return (
    isCurrent &&
    same(document.country, input.country) &&
    (!document.city || same(document.city, input.city)) &&
    (!input.category || document.category === input.category)
  );
};

let cachedEmbeddings: number[][] | undefined;

export const resetKnowledgeIndex = (): void => {
  cachedEmbeddings = undefined;
};

export const searchKnowledge = async (
  input: KnowledgeSearchInput,
  embedder: Embedder = defaultEmbedder
): Promise<KnowledgeSearchResult> => {
  const candidates = KNOWLEDGE_CORPUS.filter((document) => matchesMetadata(document, input));
  let strategy: KnowledgeSearchResult['retrieval']['strategy'] = 'hybrid';
  let queryEmbedding: number[] | undefined;

  try {
    if (!cachedEmbeddings) {
      cachedEmbeddings = await embedder(
        KNOWLEDGE_CORPUS.map((document) => `${document.title}\n${document.content}`)
      );
    }
    [queryEmbedding] = await embedder([input.query]);
  } catch {
    strategy = 'lexical-fallback';
  }

  const ranked = candidates
    .map((document) => {
      const lexical = lexicalScore(input.query, document);
      const corpusIndex = KNOWLEDGE_CORPUS.findIndex((item) => item.id === document.id);
      const vector =
        queryEmbedding && cachedEmbeddings?.[corpusIndex]
          ? cosineSimilarity(queryEmbedding, cachedEmbeddings[corpusIndex])
          : 0;
      const score =
        strategy === 'hybrid' ? VECTOR_WEIGHT * vector + LEXICAL_WEIGHT * lexical : lexical;
      return {
        document,
        score: Number(score.toFixed(4)),
        citation: `[${document.sourceName}](${document.sourceUrl})`,
      };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, input.maxResults);

  return {
    query: input.query,
    results: ranked,
    retrieval: { strategy, searchedDocuments: candidates.length },
  };
};
