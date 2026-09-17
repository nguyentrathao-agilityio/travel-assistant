import { render, screen } from '@testing-library/react-native';

import { WeatherCard } from '../WeatherCard';
import { ThemeProvider } from '../../theme';

import type { DailyForecast, WeatherResult } from '@repo/types';

const makeDay = (overrides: Partial<DailyForecast> = {}): DailyForecast => ({
  date: '2026-09-20',
  tempMinC: 20,
  tempMaxC: 30,
  precipitationProbabilityMax: 10,
  weatherCode: 0,
  description: 'Clear sky',
  ...overrides,
});

const baseWeather: WeatherResult = {
  location: { name: 'Hanoi', country: 'Vietnam', latitude: 21.0, longitude: 105.8 },
  current: {
    time: '2026-09-20T08:00:00',
    temperatureC: 28,
    apparentTemperatureC: 30,
    relativeHumidity: 70,
    windSpeedKmh: 10,
    description: 'Clear sky',
  },
  daily: [
    makeDay({ date: '2026-09-20', precipitationProbabilityMax: 40 }),
    makeDay({ date: '2026-09-21', precipitationProbabilityMax: 5 }),
    makeDay({ date: '2026-09-22', precipitationProbabilityMax: 60 }),
  ],
  travelTip: 'Bring an umbrella just in case.',
};

test('renders the location header and multi-day forecast', async () => {
  await render(
    <ThemeProvider>
      <WeatherCard data={baseWeather} />
    </ThemeProvider>
  );

  expect(screen.getByText('☀️ Hanoi Weather')).toBeOnTheScreen();
  expect(screen.getByText('3-days forecast')).toBeOnTheScreen();
  expect(screen.getByText('Tip: Bring an umbrella just in case.')).toBeOnTheScreen();
});

test('highlights the best day for outdoor activities', async () => {
  await render(
    <ThemeProvider>
      <WeatherCard data={baseWeather} />
    </ThemeProvider>
  );

  expect(screen.getByText(/Best day for outdoor activities: Sep 21/)).toBeOnTheScreen();
});

test('renders a single day without the best-day banner', async () => {
  const singleDayWeather: WeatherResult = { ...baseWeather, daily: [makeDay()] };

  await render(
    <ThemeProvider>
      <WeatherCard data={singleDayWeather} />
    </ThemeProvider>
  );

  expect(screen.getByText('1-day forecast')).toBeOnTheScreen();
  expect(screen.queryByText(/Best day for outdoor activities/)).not.toBeOnTheScreen();
});

test('renders without a travel tip', async () => {
  const noTipWeather: WeatherResult = { ...baseWeather, travelTip: '' };

  await render(
    <ThemeProvider>
      <WeatherCard data={noTipWeather} />
    </ThemeProvider>
  );

  expect(screen.queryByText(/^Tip:/)).not.toBeOnTheScreen();
});
