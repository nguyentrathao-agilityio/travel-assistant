import { z } from 'zod';

// Schemas
import { WeatherResponse, WeatherResponseSchema, WeatherResultSchema } from '@/schemas';

// Constants
import { API_URL, ENDPOINTS } from '@/constants';

// Infrastructure
import { getOpenAIClient, OPENAI_CLIENT_MODEL } from '@/infrastructure/llm';

type WeatherToolOutput = z.infer<typeof WeatherResultSchema>;

/**
 * Generates a contextual travel tip based on weather conditions using OpenAI.
 */
export const generateTravelTip = async (
  current: WeatherResponse['current'],
  daily?: WeatherResponse['daily']
): Promise<string> => {
  try {
    const weatherSummary = `
      Current conditions:
      - Temperature: ${current.temperature_c}°C (feels like ${current.apparent_temperature_c}°C)
      - Humidity: ${current.relative_humidity}%
      - Wind speed: ${current.wind_speed_kmh} km/h
      - Conditions: ${current.description}

      ${
        daily && daily.length > 0
          ? `Tomorrow's forecast: ${daily[0].description}, high ${daily[0].temp_max_c}°C,
        precipitation chance ${daily[0].precipitation_probability_max}%`
          : ''
      }`;

    const response = await getOpenAIClient().responses.create({
      model: OPENAI_CLIENT_MODEL,
      input: `Generate a single, concise travel tip (max 15 words) for someone traveling in these weather conditions.
        Focus on practical advice like clothing, hydration, or safety. Be direct and actionable. Weather data:\n${weatherSummary}`,
    });

    return response.output_text.trim() || 'Check local weather conditions before heading out';
  } catch (error) {
    console.error('Failed to generate AI travel tip:', error);
    return 'Check local weather conditions before heading out';
  }
};

/**
 * Fetches current weather and forecast for a city, including an AI-generated travel tip.
 */
export const getWeather = async (inputData: {
  city: string;
  days?: number;
}): Promise<WeatherToolOutput> => {
  const { city, days = 5 } = inputData;

  const endpoint = `${API_URL}${ENDPOINTS.WEATHER}`;
  const params = new URLSearchParams({
    city: city.trim(),
    days: String(days),
  });

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`Weather API failed: ${res.status} ${res.statusText}`);
    }

    const raw = await res.json();
    const parsed = WeatherResponseSchema.safeParse(raw);

    if (!parsed.success) {
      throw new Error(`Invalid weather response shape: ${parsed.error.message}`);
    }

    const data = parsed.data;
    const travelTip = await generateTravelTip(data.current, data.daily);

    return {
      location: data.location,
      current: {
        time: data.current.time,
        temperatureC: data.current.temperature_c,
        apparentTemperatureC: data.current.apparent_temperature_c,
        relativeHumidity: data.current.relative_humidity,
        windSpeedKmh: data.current.wind_speed_kmh,
        weatherCode: data.current.weather_code,
        description: data.current.description,
      },
      daily: data.daily?.map((day) => ({
        date: day.date,
        tempMinC: day.temp_min_c,
        tempMaxC: day.temp_max_c,
        precipitationProbabilityMax: day.precipitation_probability_max,
        weatherCode: day.weather_code ?? 0,
        description: day.description,
      })),
      attribution: data.attribution,
      travelTip,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch weather: ${error.message}`);
    }
    throw new Error('Failed to fetch weather: Unknown error');
  }
};
