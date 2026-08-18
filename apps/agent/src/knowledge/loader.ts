import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Schemas
import type { KnowledgeDocument, KnowledgeSource } from '@/schemas';

// Constants
import {
  KNOWLEDGE_CHUNK_OVERLAP,
  KNOWLEDGE_CHUNK_SIZE,
  KNOWLEDGE_FETCH_TIMEOUT_MS,
} from '@/constants';

import { sanitizeSourceContent } from '@/utils/html';

export { sanitizeSourceContent } from '@/utils/html';

type Fetcher = typeof fetch;

/** Fetches and sanitizes a source, rejecting failed or suspiciously short responses. */
export const loadKnowledgeSource = async (
  source: KnowledgeSource,
  fetcher: Fetcher = fetch
): Promise<string> => {
  // Bound external fetches and request only formats the ingestion pipeline can sanitize.
  const response = await fetcher(source.sourceUrl, {
    headers: { accept: 'text/html,text/markdown,text/plain' },
    signal: AbortSignal.timeout(KNOWLEDGE_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${source.id}: HTTP ${response.status}`);
  }

  // Reject unusable content before it reaches chunking and embedding.
  const content = sanitizeSourceContent(
    await response.text(),
    response.headers.get('content-type') ?? ''
  );

  if (content.length < 100) {
    throw new Error(`Failed to load ${source.id}: source content is empty or too short`);
  }

  return content;
};

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: KNOWLEDGE_CHUNK_SIZE,
  chunkOverlap: KNOWLEDGE_CHUNK_OVERLAP,
});

/** Splits a loaded source's content into overlapping chunks, each a standalone `KnowledgeDocument` ready to embed. */
export const splitKnowledgeSource = async (
  source: KnowledgeSource,
  content: string
): Promise<KnowledgeDocument[]> => {
  // Turn overlapping text chunks into stable, source-linked documents for retrieval.
  const chunks = await splitter.splitText(content);

  return chunks
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, chunkIndex) => {
      const chunkId = `${source.id}:chunk:${String(chunkIndex).padStart(4, '0')}`;

      return {
        ...source,
        id: chunkId,
        sourceId: source.id,
        chunkId,
        chunkIndex,
        content: chunk,
      };
    });
};
