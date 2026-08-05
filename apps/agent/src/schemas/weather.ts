import { z } from 'zod';

export const WeatherInputSchema = z.object({
  city: z.string().describe('City name to look up, e.g. "Da Nang" or "Bangkok"'),
  days: z
    .number()
    .int()
    .min(1)
    .max(16)
    .optional()
    .describe('Number of forecast days (1-16), defaults to 5'),
});

export type WeatherInput = z.infer<typeof WeatherInputSchema>;

// Response schema from the weather API
export const WeatherResponseSchema = z.object({
  location: z.object({
    name: z.string(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string().optional(),
  }),
  current: z.object({
    time: z.string(), // ISO 8601 local observation time
    temperature_c: z.number(),
    apparent_temperature_c: z.number(), // feels-like, °C
    relative_humidity: z.number(), // percent
    wind_speed_kmh: z.number(),
    weather_code: z.number().optional(),
    description: z.string(),
  }),
  daily: z
    .array(
      z.object({
        date: z.string(),
        temp_min_c: z.number(),
        temp_max_c: z.number(),
        precipitation_probability_max: z.number().optional(), // peak precip probability, %
        weather_code: z.number().optional(),
        description: z.string(),
      })
    )
    .optional(),
  attribution: z.string().optional(),
});

export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;

// Camel-case tool output.
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
