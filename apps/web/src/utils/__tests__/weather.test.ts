import { toFahrenheit, getWeatherIcon, formatDayDate, getBestDayIndex } from '@/utils/weather';
import type { DailyForecast } from '@repo/types';

jest.mock('@/constants', () => ({
  FAHRENHEIT_MULTIPLIER: 9 / 5,
  FAHRENHEIT_OFFSET: 32,
}));

const makeForecast = (precipitationProbabilityMax?: number): DailyForecast => ({
  date: '2026-06-10',
  description: '',
  tempMaxC: 30,
  tempMinC: 22,
  precipitationProbabilityMax,
  weatherCode: 0,
});

describe('toFahrenheit', () => {
  it('converts 0°C to 32°F', () => {
    expect(toFahrenheit(0)).toBe(32);
  });

  it('converts 100°C to 212°F', () => {
    expect(toFahrenheit(100)).toBe(212);
  });

  it('converts 37°C to 99°F (body temperature, rounded)', () => {
    expect(toFahrenheit(37)).toBe(99);
  });

  it('converts negative Celsius', () => {
    expect(toFahrenheit(-40)).toBe(-40);
  });
});

describe('getWeatherIcon', () => {
  it('returns a default icon when code is undefined', () => {
    const { icon, color } = getWeatherIcon(undefined);

    expect(icon).toBeDefined();
    expect(color.length).toBeGreaterThan(0);
  });

  it('returns a sunny icon for code 0', () => {
    const { color } = getWeatherIcon(0);

    expect(color).toContain('yellow');
  });

  it('returns a cloud icon for code 48', () => {
    const { color } = getWeatherIcon(48);

    expect(color).toContain('gray');
  });

  it('returns a rain icon for code 67', () => {
    const { color } = getWeatherIcon(67);

    expect(color).toContain('blue');
  });

  it('returns a snow icon for code 77', () => {
    const { color } = getWeatherIcon(77);

    expect(color).toContain('sky');
  });
});

describe('formatDayDate', () => {
  it('formats a date string as "Mon DD"', () => {
    expect(formatDayDate('2026-06-10')).toBe('Jun 10');
  });

  it('formats January correctly', () => {
    expect(formatDayDate('2026-01-01')).toBe('Jan 1');
  });

  it('formats December correctly', () => {
    expect(formatDayDate('2026-12-25')).toBe('Dec 25');
  });
});

describe('getBestDayIndex', () => {
  it('returns 0 when all forecasts have missing precipitation data', () => {
    expect(getBestDayIndex([makeForecast(), makeForecast()])).toBe(0);
  });

  it('returns the index of the day with lowest precipitation probability', () => {
    const forecasts = [makeForecast(80), makeForecast(20), makeForecast(60)];

    expect(getBestDayIndex(forecasts)).toBe(1);
  });

  it('returns 0 for a single-day forecast', () => {
    expect(getBestDayIndex([makeForecast(50)])).toBe(0);
  });

  it('returns the first best day when multiple days tie for lowest', () => {
    const forecasts = [makeForecast(20), makeForecast(20), makeForecast(80)];

    expect(getBestDayIndex(forecasts)).toBe(0);
  });
});
