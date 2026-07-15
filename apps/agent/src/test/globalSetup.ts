import { LLMock } from '@copilotkit/aimock';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { RAG_SEED_DOCS } from '@/constants';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');

let mock: LLMock;

export async function setup() {
  if (process.env.SKIP_AIMOCK === '1') return;

  const realApiKey = process.env.OPENAI_API_KEY;

  mock = new LLMock({ port: 4010 });
  mock.loadFixtureDir(FIXTURES_DIR);

  if (process.env.RECORD === '1') {
    mock.enableRecording({
      providers: { openai: realApiKey! },
      fixturePath: FIXTURES_DIR,
    });
  }

  await mock.start();

  process.env.OPENAI_BASE_URL = `${mock.url}/v1`;
  process.env.OPENAI_API_KEY = 'mock';

  // Seed RAG once — only when a real vector store is available
  if (process.env.POSTGRES_URL) {
    const { ingestDocument } = await import('../mastra/ingest');
    for (const doc of RAG_SEED_DOCS) {
      await ingestDocument(doc.content, doc.filename);
    }
  }
}

export async function teardown() {
  await mock?.stop();
}
