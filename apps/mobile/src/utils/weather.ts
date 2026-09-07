import type { DailyForecast } from '@repo/types';

export const toFahrenheit = (c: number): number => Math.round((c * 9) / 5 + 32);

export const formatDayDate = (dateStr: string): string => {
  const date = new Date(`${dateStr}T00:00:00`);

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Returns the index of the day with the lowest precipitation probability.
 * Defaults to index 0 when all values are missing or equal.
 */
export const getBestDayIndex = (daily: DailyForecast[]): number =>
  daily.reduce((bestIdx, day, idx, arr) => {
    const current = day.precipitationProbabilityMax ?? 100;
    const best = arr[bestIdx].precipitationProbabilityMax ?? 100;

    return current < best ? idx : bestIdx;
  }, 0);
