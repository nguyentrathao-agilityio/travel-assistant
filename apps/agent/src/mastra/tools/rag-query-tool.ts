import { createVectorQueryTool } from '@mastra/rag';
import { openai } from '@ai-sdk/openai';
import { VECTOR_STORE_NAME, VECTOR_INDEX_NAME } from '../stores';

type RagQueryTool = ReturnType<typeof createVectorQueryTool>;

export const ragQueryTool: RagQueryTool = createVectorQueryTool({
  vectorStoreName: VECTOR_STORE_NAME,
  description:
    'Search the travel knowledge base and uploaded documents for destination-specific information, practical travel tips (health, safety, money, transport, culture, visa, food, connectivity), and any user-uploaded files. Only use filter with key "threadId" to filter by thread. Never use other filter keys.',
  indexName: VECTOR_INDEX_NAME,
  model: openai.embedding('text-embedding-3-small'),
  enableFilter: true,
  includeSources: true,
});
