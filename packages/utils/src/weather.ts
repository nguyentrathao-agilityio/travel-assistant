import type { DailyForecast } from '@repo/types';

export const toFahrenheit = (celsius: number): number => Math.round((celsius * 9) / 5 + 32);

export const formatDayDate = (dateStr: string): string =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

export const getBestDayIndex = (daily: DailyForecast[]): number =>
  daily.reduce((bestIndex, day, index, forecasts) => {
    const current = day.precipitationProbabilityMax ?? 100;
    const best = forecasts[bestIndex].precipitationProbabilityMax ?? 100;

    return current < best ? index : bestIndex;
  }, 0);
