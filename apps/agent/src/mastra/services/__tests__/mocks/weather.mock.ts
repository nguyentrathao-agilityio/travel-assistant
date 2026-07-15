export const apiWeather = {
  location: {
    name: 'Da Nang',
    country: 'Vietnam',
    latitude: 16.06,
    longitude: 108.22,
    timezone: 'Asia/Ho_Chi_Minh',
  },
  current: {
    time: '2026-08-01T12:00:00',
    temperature_c: 32,
    apparent_temperature_c: 36,
    relative_humidity: 75,
    wind_speed_kmh: 15,
    weather_code: 1,
    description: 'Sunny',
  },
  daily: [
    {
      date: '2026-08-02',
      temp_min_c: 26,
      temp_max_c: 34,
      precipitation_probability_max: 10,
      weather_code: 1,
      description: 'Partly cloudy',
    },
  ],
  attribution: 'Open-Meteo',
};
