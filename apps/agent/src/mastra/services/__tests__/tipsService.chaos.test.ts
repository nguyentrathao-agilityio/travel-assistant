import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { LLMock } from '@copilotkit/aimock';

import { getLocalTips } from '../tipsService';
import { API_URL, createMswServer } from '../../../test/mswServer';
import { apiTipsResponse } from './mocks/tips.mock';

// Disable SDK retries so 500s fail immediately instead of backing off for ~3s.
vi.mock('../../utils/openaiClient', async () => {
  const { OpenAI } = await import('openai');
  return {
    getOpenAIClient: () =>
      new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? 'mock',
        baseURL: process.env.OPENAI_BASE_URL,
        maxRetries: 0,
      }),
    OPENAI_CLIENT_MODEL: 'gpt-4o-mini',
  };
});

const server = createMswServer();

describe('getLocalTips — LLM chaos (500 drop)', () => {
  let mock: LLMock;

  beforeAll(async () => {
    mock = new LLMock({ port: 0 });
    mock.setChaos({ dropRate: 1.0 });
    await mock.start();
    process.env.OPENAI_BASE_URL = `${mock.url}/v1`;
  });

  afterAll(async () => {
    await mock.stop();
  });

  it('returns empty tips when the LLM returns 500 during the fallback path', async () => {
    server.use(http.get(`${API_URL}/tips`, () => HttpResponse.json(apiTipsResponse([]))));

    const result = await getLocalTips({ country: 'Vietnam' });

    expect(result.tips).toHaveLength(0);
    expect(result.country).toBe('Vietnam');
  });
});

describe('getLocalTips — LLM chaos (malformed JSON)', () => {
  let mock: LLMock;

  beforeAll(async () => {
    mock = new LLMock({ port: 0 });
    mock.setChaos({ malformedRate: 1.0 });
    await mock.start();
    process.env.OPENAI_BASE_URL = `${mock.url}/v1`;
  });

  afterAll(async () => {
    await mock.stop();
  });

  it('returns empty tips when the LLM returns malformed JSON during the fallback path', async () => {
    server.use(http.get(`${API_URL}/tips`, () => HttpResponse.json(apiTipsResponse([]))));

    const result = await getLocalTips({ country: 'Vietnam' });

    expect(result.tips).toHaveLength(0);
  });
});
