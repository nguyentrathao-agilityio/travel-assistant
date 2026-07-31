import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { KNOWLEDGE_CHUNK_OVERLAP, KNOWLEDGE_CHUNK_SIZE } from '../constants';
import type { KnowledgeDocument, KnowledgeSource } from '../schemas/knowledge';

type Fetcher = typeof fetch;

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

export const sanitizeSourceContent = (rawContent: string, contentType = ''): string => {
  const withoutExecutableContent = rawContent
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const plainText = contentType.includes('html')
    ? withoutExecutableContent
        .replace(/<(br|hr)\s*\/?>/gi, '\n')
        .replace(/<\/(article|div|h[1-6]|li|main|p|section)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
    : withoutExecutableContent;

  return decodeHtmlEntities(plainText)
    .replace(/\r/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const loadKnowledgeSource = async (
  source: KnowledgeSource,
  fetcher: Fetcher = fetch
): Promise<string> => {
  const response = await fetcher(source.sourceUrl, {
    headers: { accept: 'text/html,text/markdown,text/plain' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Failed to load ${source.id}: HTTP ${response.status}`);
  }

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

export const splitKnowledgeSource = async (
  source: KnowledgeSource,
  content: string
): Promise<KnowledgeDocument[]> => {
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
