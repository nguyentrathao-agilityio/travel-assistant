import { afterEach, describe, expect, it, vi } from 'vitest';

const getWeatherMock = vi.fn();
const getLocalTipsMock = vi.fn();
const getPlacesMock = vi.fn();

vi.mock('@/services/weather', () => ({
  getWeather: (...args: unknown[]) => getWeatherMock(...args),
}));
vi.mock('@/services/tips', () => ({
  getLocalTips: (...args: unknown[]) => getLocalTipsMock(...args),
}));
vi.mock('@/services/places', () => ({ getPlaces: (...args: unknown[]) => getPlacesMock(...args) }));

import { getDestinationExplorer } from '@/services/destination-explorer';

const weather = {
  location: { name: 'Da Nang', country: 'Vietnam', latitude: 16.05, longitude: 108.2 },
  current: {
    time: '2026-07-29T10:00:00',
    temperatureC: 30,
    apparentTemperatureC: 33,
    relativeHumidity: 80,
    windSpeedKmh: 12,
    description: 'Sunny',
  },
  travelTip: 'Stay hydrated.',
};

const tips = { country: 'Vietnam', count: 0, summary: 'Overview', tips: [] };
const places = { total: 0, results: [] };

afterEach(() => {
  vi.clearAllMocks();
});

describe('getDestinationExplorer', () => {
  it('chains weather -> tips -> places and combines the results', async () => {
    getWeatherMock.mockResolvedValueOnce(weather);
    getLocalTipsMock.mockResolvedValueOnce(tips);
    getPlacesMock.mockResolvedValueOnce(places);

    const result = await getDestinationExplorer({ city: 'Da Nang' });

    expect(result.city).toBe('Da Nang');
    expect(result.weather).toEqual(weather);
    expect(result.tips).toEqual(tips);
    expect(result.places).toEqual(places);
  });

  it("uses the weather API's resolved country when none is given", async () => {
    getWeatherMock.mockResolvedValueOnce(weather);
    getLocalTipsMock.mockResolvedValueOnce(tips);
    getPlacesMock.mockResolvedValueOnce(places);

    await getDestinationExplorer({ city: 'Da Nang' });

    expect(getLocalTipsMock).toHaveBeenCalledWith({ city: 'Da Nang', country: 'Vietnam' });
  });

  it('propagates an error when the weather lookup fails', async () => {
    getWeatherMock.mockRejectedValueOnce(new Error('weather down'));

    await expect(getDestinationExplorer({ city: 'Da Nang' })).rejects.toThrow('weather down');
    expect(getLocalTipsMock).not.toHaveBeenCalled();
  });
});
