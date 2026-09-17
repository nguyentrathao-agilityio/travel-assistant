import { render, screen } from '@testing-library/react-native';

import { WeatherDayCard } from '../WeatherDayCard';
import { ThemeProvider } from '../../theme';

import type { DailyForecast } from '@repo/types';

const baseDay: DailyForecast = {
  date: '2026-09-20',
  tempMinC: 20,
  tempMaxC: 30,
  precipitationProbabilityMax: 10,
  weatherCode: 0,
  description: 'Clear sky',
};

test('renders the date, temperatures, condition and rain chance', async () => {
  await render(
    <ThemeProvider>
      <WeatherDayCard day={baseDay} dayNumber={1} />
    </ThemeProvider>
  );

  expect(screen.getByText('1')).toBeOnTheScreen();
  expect(screen.getByText('Clear sky')).toBeOnTheScreen();
  expect(screen.getByText('86°F')).toBeOnTheScreen();
  expect(screen.getByText('68°F')).toBeOnTheScreen();
  expect(screen.getByText('💧 10%')).toBeOnTheScreen();
  expect(screen.getByText('☀️')).toBeOnTheScreen();
});

test('hides the day number badge when showNumber is false', async () => {
  await render(
    <ThemeProvider>
      <WeatherDayCard day={baseDay} dayNumber={1} showNumber={false} />
    </ThemeProvider>
  );

  expect(screen.queryByText('1')).not.toBeOnTheScreen();
});

test('shows a best-day badge', async () => {
  await render(
    <ThemeProvider>
      <WeatherDayCard day={baseDay} dayNumber={2} isBest />
    </ThemeProvider>
  );

  expect(screen.getByText('Best')).toBeOnTheScreen();
});

test('falls back to a default weather icon when the code is missing', async () => {
  await render(
    <ThemeProvider>
      <WeatherDayCard day={{ ...baseDay, weatherCode: undefined }} dayNumber={1} />
    </ThemeProvider>
  );

  expect(screen.getByText('⛈️')).toBeOnTheScreen();
});

test('maps a rainy weather code to a rain icon', async () => {
  await render(
    <ThemeProvider>
      <WeatherDayCard day={{ ...baseDay, weatherCode: 61 }} dayNumber={1} />
    </ThemeProvider>
  );

  expect(screen.getByText('🌧️')).toBeOnTheScreen();
});
