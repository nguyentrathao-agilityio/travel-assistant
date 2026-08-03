import { afterEach, describe, expect, it, vi } from 'vitest';

const createMock = vi.fn();
vi.mock('../../infrastructure/llm', () => ({
  getOpenAIClient: () => ({ responses: { create: createMock } }),
  OPENAI_CLIENT_MODEL: 'gpt-4o-mini',
}));

import { generateTipsFromLLM, getLocalTips } from '../tips';

const apiTip = {
  id: 't1',
  category: 'money',
  scope: 'country',
  title: 'Carry cash',
  content: 'Many small vendors do not accept cards.',
  is_essential: true,
  location: 'Vietnam',
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('getLocalTips', () => {
  it('maps API tips to camelCase when the API returns results', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ country: 'Vietnam', count: 1, summary: 'Overview', tips: [apiTip] })
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await getLocalTips({ country: 'Vietnam' });

    expect(result.tips).toEqual([
      {
        id: 't1',
        category: 'money',
        scope: 'country',
        title: 'Carry cash',
        content: 'Many small vendors do not accept cards.',
        isEssential: true,
        location: 'Vietnam',
      },
    ]);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('falls back to LLM-generated tips when the API returns none', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ country: 'Vietnam', count: 0, summary: 'Overview', tips: [] })
        )
      );
    vi.stubGlobal('fetch', fetchMock);
    createMock.mockResolvedValueOnce({
      output_text: JSON.stringify({
        tips: [
          {
            id: 'llm-1',
            category: 'safety',
            scope: 'country',
            title: 'Watch for traffic',
            content: 'Look both ways, scooters everywhere.',
            isEssential: true,
            location: 'Vietnam',
          },
        ],
      }),
    });

    const result = await getLocalTips({ country: 'Vietnam' });

    expect(result.tips).toHaveLength(1);
    expect(result.tips[0].title).toBe('Watch for traffic');
  });

  it('throws when the API responds with a non-OK status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getLocalTips({ country: 'Vietnam' })).rejects.toThrow('API error 500');
  });

  it('throws when the API response does not match the expected shape', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ oops: true })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getLocalTips({ country: 'Vietnam' })).rejects.toThrow('Invalid response from');
  });
});

describe('generateTipsFromLLM', () => {
  it('returns an empty array when the LLM response does not match the expected shape', async () => {
    createMock.mockResolvedValueOnce({ output_text: JSON.stringify({ oops: true }) });

    const result = await generateTipsFromLLM('Da Nang', 'Vietnam', 'summary');

    expect(result).toEqual([]);
  });

  it('returns an empty array when the LLM call throws', async () => {
    createMock.mockRejectedValueOnce(new Error('openai down'));

    const result = await generateTipsFromLLM('Da Nang', 'Vietnam', 'summary');

    expect(result).toEqual([]);
  });

  it('strips markdown code fences before parsing the LLM response', async () => {
    createMock.mockResolvedValueOnce({
      output_text: '```json\n{"tips":[]}\n```',
    });

    const result = await generateTipsFromLLM('Da Nang', 'Vietnam', 'summary');

    expect(result).toEqual([]);
  });
});
