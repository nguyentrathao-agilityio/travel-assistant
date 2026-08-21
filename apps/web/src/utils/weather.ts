import {
  type LucideIcon,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
} from 'lucide-react';

// Types
import type { DailyForecast } from '@repo/types';

// Constants
import { FAHRENHEIT_MULTIPLIER, FAHRENHEIT_OFFSET } from '@/constants';

const WEATHER_ICON_THRESHOLDS: [number, LucideIcon, string][] = [
  [0, Sun, 'text-yellow-500'],
  [3, CloudSun, 'text-yellow-400'],
  [48, Cloud, 'text-gray-400'],
  [67, CloudRain, 'text-blue-400'],
  [77, Snowflake, 'text-sky-300'],
  [82, CloudRain, 'text-blue-500'],
  [86, Snowflake, 'text-cyan-300'],
];

/** Converts Celsius to Fahrenheit, rounded to the nearest integer. */
export const toFahrenheit = (c: number): number =>
  Math.round(c * FAHRENHEIT_MULTIPLIER + FAHRENHEIT_OFFSET);

/** Maps a WMO weather-interpretation code to the closest lucide-react icon. */
export const getWeatherIcon = (code?: number): { icon: LucideIcon; color: string } => {
  const defaultIcon = { icon: CloudLightning, color: 'text-gray-500' };

  if (code === undefined) return defaultIcon;
  const match = WEATHER_ICON_THRESHOLDS.find(([threshold]) => code <= threshold);

  return {
    icon: match ? match[1] : defaultIcon.icon,
    color: match ? match[2] : defaultIcon.color,
  };
};

/** Formats an ISO date string (YYYY-MM-DD) as "Mon DD", e.g. "May 29". */
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
