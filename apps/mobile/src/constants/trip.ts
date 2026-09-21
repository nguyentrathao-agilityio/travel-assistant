export const MAX_TRIP_PLACES = 6;
export const MAX_TRIP_TIPS = 4;

export const DEFAULT_COST_ICON = '🏷️';

export const COST_ICON_MAP: { keywords: string[]; icon: string }[] = [
  { keywords: ['flight', 'air'], icon: '✈️' },
  { keywords: ['hotel', 'accommodation', 'stay', 'room'], icon: '🏨' },
  { keywords: ['food', 'meal', 'dining', 'restaurant'], icon: '🍜' },
  { keywords: ['activity', 'activities', 'tour', 'sightseeing'], icon: '🎯' },
];

export const DEFAULT_WEATHER_ICON = '⛈️';

export const WEATHER_ICON_THRESHOLDS: [number, string][] = [
  [0, '☀️'],
  [3, '⛅'],
  [48, '☁️'],
  [67, '🌧️'],
  [77, '❄️'],
  [82, '🌧️'],
  [86, '❄️'],
];
