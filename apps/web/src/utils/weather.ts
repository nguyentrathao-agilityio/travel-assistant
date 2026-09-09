import {
  type LucideIcon,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
} from 'lucide-react';

const WEATHER_ICON_THRESHOLDS: [number, LucideIcon, string][] = [
  [0, Sun, 'text-yellow-500'],
  [3, CloudSun, 'text-yellow-400'],
  [48, Cloud, 'text-gray-400'],
  [67, CloudRain, 'text-blue-400'],
  [77, Snowflake, 'text-sky-300'],
  [82, CloudRain, 'text-blue-500'],
  [86, Snowflake, 'text-cyan-300'],
];

export const getWeatherIcon = (code?: number): { icon: LucideIcon; color: string } => {
  const defaultIcon = { icon: CloudLightning, color: 'text-gray-500' };

  if (code === undefined) return defaultIcon;
  const match = WEATHER_ICON_THRESHOLDS.find(([threshold]) => code <= threshold);

  return {
    icon: match ? match[1] : defaultIcon.icon,
    color: match ? match[2] : defaultIcon.color,
  };
};
