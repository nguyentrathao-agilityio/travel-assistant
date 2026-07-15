import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { LLMock } from '@copilotkit/aimock';

import { getWeather } from '../weatherService';
import { API_URL, createMswServer } from '../../../test/mswServer';
import { apiWeather } from './mocks/weather.mock';

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

const FALLBACK_TIP = 'Check local weather conditions before heading out';

describe('getWeather — LLM chaos (500 drop)', () => {
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

  it('returns the fallback tip when the LLM returns 500', async () => {
    server.use(http.get(`${API_URL}/weather`, () => HttpResponse.json(apiWeather)));

    const result = await getWeather({ city: 'Da Nang' });

    expect(result.travelTip).toBe(FALLBACK_TIP);
    expect(result.location.name).toBe('Da Nang');
  });
});

describe('getWeather — LLM chaos (malformed JSON)', () => {
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

  it('returns the fallback tip when the LLM returns malformed JSON', async () => {
    server.use(http.get(`${API_URL}/weather`, () => HttpResponse.json(apiWeather)));

    const result = await getWeather({ city: 'Da Nang' });

    expect(result.travelTip).toBe(FALLBACK_TIP);
  });
});
