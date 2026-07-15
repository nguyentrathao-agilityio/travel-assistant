import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { getLocalTips } from '../tipsService';
import { API_URL, createMswServer } from '../../../test/mswServer';
import { mockTip, apiTipsResponse } from './mocks/tips.mock';

import tipsFixture from '../../../test/fixtures/tips.fixture.json';

const server = createMswServer();

describe('getLocalTips', () => {
  it('returns API tips when the API has data', async () => {
    server.use(http.get(`${API_URL}/tips`, () => HttpResponse.json(apiTipsResponse([mockTip]))));

    const result = await getLocalTips({ country: 'Vietnam', city: 'Da Nang' });

    expect(result.country).toBe('Vietnam');
    expect(result.count).toBe(1);
    expect(result.tips[0]).toEqual({
      id: mockTip.id,
      category: mockTip.category,
      scope: 'country',
      title: mockTip.title,
      content: mockTip.content,
      isEssential: mockTip.is_essential,
      location: mockTip.location,
    });
  });

  it('falls back to LLM when API returns empty tips (AIMock intercepts OpenAI)', async () => {
    server.use(http.get(`${API_URL}/tips`, () => HttpResponse.json(apiTipsResponse([]))));

    const result = await getLocalTips({ country: 'Vietnam' });

    const firstTip = tipsFixture.fixtures[0].response.content.tips[0];

    expect(result.country).toBe('Vietnam');
    expect(result.tips.length).toBe(6);
    expect(result.tips[0]).toEqual({
      id: firstTip.id,
      category: firstTip.category,
      scope: 'country',
      title: firstTip.title,
      content: firstTip.content,
      isEssential: firstTip.isEssential,
      location: firstTip.location,
    });
    expect(result.tips.filter((t) => t.isEssential)).toHaveLength(2);
  });

  it('returns empty tips when the API fails', async () => {
    server.use(http.get(`${API_URL}/tips`, () => new HttpResponse(null, { status: 500 })));

    await expect(getLocalTips({ country: 'Vietnam' })).rejects.toThrow();
  });
});
