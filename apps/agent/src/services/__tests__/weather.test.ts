import { afterEach, describe, expect, it, vi } from 'vitest';

// Services
import { getWeather } from '@/services/weather';

const createMock = vi.fn();

vi.mock('@/infrastructure/llm', () => ({
  getOpenAIClient: () => ({ responses: { create: createMock } }),
  OPENAI_CLIENT_MODEL: 'gpt-4o-mini',
}));

const apiResponse = {
  location: { name: 'Da Nang', country: 'Vietnam', latitude: 16.05, longitude: 108.2 },
  current: {
    time: '2026-07-29T10:00:00',
    temperature_c: 30,
    apparent_temperature_c: 33,
    relative_humidity: 80,
    wind_speed_kmh: 12,
    weather_code: 1,
    description: 'Sunny',
  },
  daily: [
    {
      date: '2026-07-30',
      temp_min_c: 25,
      temp_max_c: 32,
      precipitation_probability_max: 20,
      weather_code: 1,
      description: 'Sunny',
    },
  ],
  attribution: 'Open-Meteo',
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('getWeather', () => {
  it('maps a valid API response to camelCase and includes an AI travel tip', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(apiResponse)));

    vi.stubGlobal('fetch', fetchMock);
    createMock.mockResolvedValueOnce({ output_text: 'Wear light clothing.' });

    const result = await getWeather({ city: 'Da Nang' });

    expect(result.location.name).toBe('Da Nang');
    expect(result.current.temperatureC).toBe(30);
    expect(result.daily?.[0].tempMaxC).toBe(32);
    expect(result.travelTip).toBe('Wear light clothing.');
  });

  it('falls back to a generic travel tip when the AI call fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(apiResponse)));

    vi.stubGlobal('fetch', fetchMock);
    createMock.mockRejectedValueOnce(new Error('openai down'));

    const result = await getWeather({ city: 'Da Nang' });

    expect(result.travelTip).toBe('Check local weather conditions before heading out');
  });

  it('throws when the weather API responds with a non-OK status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }));

    vi.stubGlobal('fetch', fetchMock);

    await expect(getWeather({ city: 'Da Nang' })).rejects.toThrow('Weather API failed: 500');
  });

  it('throws when the API response does not match the expected shape', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ oops: true })));

    vi.stubGlobal('fetch', fetchMock);

    await expect(getWeather({ city: 'Da Nang' })).rejects.toThrow('Invalid weather response shape');
  });
});
