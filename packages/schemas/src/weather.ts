import { z } from 'zod';

export const WeatherResultSchema = z.object({
  location: z.object({
    name: z.string(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string().optional(),
  }),
  current: z.object({
    time: z.string(),
    temperatureC: z.number(),
    apparentTemperatureC: z.number(),
    relativeHumidity: z.number(),
    windSpeedKmh: z.number(),
    weatherCode: z.number().optional(),
    description: z.string(),
  }),
  daily: z
    .array(
      z.object({
        date: z.string(),
        tempMinC: z.number(),
        tempMaxC: z.number(),
        precipitationProbabilityMax: z.number().optional(),
        weatherCode: z.number().optional(),
        description: z.string(),
      })
    )
    .optional(),
  attribution: z.string().optional(),
  travelTip: z.string(),
});

export type WeatherResult = z.infer<typeof WeatherResultSchema>;
