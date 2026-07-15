import { WeatherResult } from '@repo/schemas';
export type { WeatherResult } from '@repo/schemas';

export type WeatherLocation = WeatherResult['location'];
export type CurrentWeather = WeatherResult['current'];
export type DailyForecast = NonNullable<WeatherResult['daily']>[number];
