import { afterEach, describe, expect, it, vi } from 'vitest';

const getWeatherMock = vi.fn();

vi.mock('../../services/weather', () => ({
  getWeather: (...args: unknown[]) => getWeatherMock(...args),
}));

import { weatherTool } from '../weather';

const toolCall = (name: string, args: object) => ({
  name,
  args,
  id: `call-${name}`,
  type: 'tool_call' as const,
});

const artifactOf = <T>(result: unknown): T => {
  if (typeof result === 'object' && result !== null && 'artifact' in result) {
    return result.artifact as T;
  }

  throw new Error('Expected a ToolMessage with an artifact');
};

const input = { city: 'Da Nang', days: 5 };

afterEach(() => {
  vi.clearAllMocks();
});

describe('weatherTool', () => {
  it('returns the weather result as the tool artifact on success', async () => {
    const weatherResult = {
      location: { name: 'Da Nang', country: 'Vietnam', latitude: 16.05, longitude: 108.2 },
      current: {
        time: '2026-08-04T12:00:00+07:00',
        temperature_c: 31,
        apparent_temperature_c: 34,
        relative_humidity: 70,
        wind_speed_kmh: 10,
      },
    };
    getWeatherMock.mockResolvedValueOnce(weatherResult);

    const result = artifactOf(await weatherTool.invoke(toolCall(weatherTool.name, input)));

    expect(getWeatherMock).toHaveBeenCalledWith(input);
    expect(result).toEqual(weatherResult);
  });

  it('returns an error artifact when getWeather throws an Error', async () => {
    getWeatherMock.mockRejectedValueOnce(new Error('provider timeout'));

    const result = artifactOf(await weatherTool.invoke(toolCall(weatherTool.name, input)));

    expect(result).toEqual({ error: 'provider timeout' });
  });

  it('falls back to the generic weather error message for a non-Error throw', async () => {
    getWeatherMock.mockRejectedValueOnce('boom');

    const result = artifactOf(await weatherTool.invoke(toolCall(weatherTool.name, input)));

    expect(result).toEqual({
      error:
        "Weather data isn't available for that location right now. Please try again in a moment.",
    });
  });
});
