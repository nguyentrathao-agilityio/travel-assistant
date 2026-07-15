import 'dotenv/config';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { MDocument } from '@mastra/rag';
import { vector, VECTOR_INDEX_NAME } from './stores';

export async function ingestDocument(content: string, filename: string) {
  const doc = MDocument.fromText(content, { filename });

  await doc.chunkRecursive({
    maxSize: 512,
    overlap: 50,
  });

  const chunks = doc.getDocs();

  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: chunks.map((c) => c.text),
  });

  await vector.upsert({
    indexName: VECTOR_INDEX_NAME,
    vectors: embeddings,
    metadata: chunks.map((c) => ({
      text: c.text,
      filename,
    })),
  });

  return { success: true, chunks: chunks.length };
}
