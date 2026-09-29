interface TomorrowWeatherPromptInput {
  description: string;
  precipitationChance?: number;
  temperatureMaxC: number;
}

interface WeatherTravelTipPromptInput {
  apparentTemperatureC: number;
  description: string;
  humidity: number;
  temperatureC: number;
  tomorrow?: TomorrowWeatherPromptInput;
  windSpeedKmh: number;
}

export const buildWeatherTravelTipPrompt = ({
  apparentTemperatureC,
  description,
  humidity,
  temperatureC,
  tomorrow,
  windSpeedKmh,
}: WeatherTravelTipPromptInput): string => `Generate a single, concise travel tip (max 15 words) for someone traveling in these weather conditions.
Focus on practical advice like clothing, hydration, or safety. Be direct and actionable.

Current conditions:
- Temperature: ${temperatureC}°C (feels like ${apparentTemperatureC}°C)
- Humidity: ${humidity}%
- Wind speed: ${windSpeedKmh} km/h
- Conditions: ${description}
${
  tomorrow
    ? `
Tomorrow's forecast: ${tomorrow.description}, high ${tomorrow.temperatureMaxC}°C,
precipitation chance ${tomorrow.precipitationChance}%`
    : ''
}`;
