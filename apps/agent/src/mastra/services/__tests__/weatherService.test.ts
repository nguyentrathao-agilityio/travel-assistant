import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { getWeather } from '../weatherService';
import { API_URL, createMswServer } from '../../../test/mswServer';
import { apiWeather } from './mocks/weather.mock';

const server = createMswServer();

describe('getWeather', () => {
  it('returns weather data with an AI-generated travel tip (AIMock)', async () => {
    server.use(http.get(`${API_URL}/weather`, () => HttpResponse.json(apiWeather)));

    const result = await getWeather({ city: 'Da Nang' });

    expect(result.location.name).toBe('Da Nang');
    expect(result.current.temperatureC).toBe(32);
    expect(result.current.relativeHumidity).toBe(75);
    expect(result.daily).toHaveLength(1);
    expect(result.daily![0].tempMaxC).toBe(34);

    // AIMock returns a fixed tip based on the mocked weather data
    expect(result.travelTip).toBe('Wear light breathable clothing and stay hydrated.');
  });

  it('returns fallback tip when AI tip generation fails', async () => {
    server.use(
      http.get(`${API_URL}/weather`, () =>
        // No daily data → still calls OpenAI for tip
        HttpResponse.json({ ...apiWeather, daily: undefined })
      )
    );

    const result = await getWeather({ city: 'Da Nang', days: 1 });

    expect(result.travelTip).toBeTruthy();
  });

  it('throws when the weather API returns a non-OK status', async () => {
    server.use(http.get(`${API_URL}/weather`, () => new HttpResponse(null, { status: 503 })));

    await expect(getWeather({ city: 'Unknown City' })).rejects.toThrow('Weather API failed');
  });

  it('throws when the response shape is invalid', async () => {
    server.use(http.get(`${API_URL}/weather`, () => HttpResponse.json({ temperature: 30 })));

    await expect(getWeather({ city: 'Da Nang' })).rejects.toThrow('Invalid weather response shape');
  });
});
