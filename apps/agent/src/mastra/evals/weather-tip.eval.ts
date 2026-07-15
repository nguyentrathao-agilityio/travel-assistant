import { evalite } from 'evalite';
import { Levenshtein } from 'autoevals';

import { generateTravelTip } from '../services/weatherService';
import { TipLength } from './scorers/tip-length.scorer';

evalite('Weather Travel Tip', {
  data: async () => [
    {
      input: {
        time: '2026-08-01T12:00:00',
        temperature_c: 35,
        apparent_temperature_c: 40,
        relative_humidity: 90,
        wind_speed_kmh: 5,
        description: 'Hot and humid',
      },
      expected: 'Wear light clothing and drink plenty of water to stay cool.',
    },
    {
      input: {
        time: '2026-12-01T10:00:00',
        temperature_c: 3,
        apparent_temperature_c: -2,
        relative_humidity: 60,
        wind_speed_kmh: 30,
        description: 'Cold and windy',
      },
      expected: 'Wear warm layers and protect yourself from the biting wind.',
    },
    {
      input: {
        time: '2026-09-01T14:00:00',
        temperature_c: 24,
        apparent_temperature_c: 26,
        relative_humidity: 85,
        wind_speed_kmh: 10,
        description: 'Rainy',
      },
      expected: 'Bring a waterproof jacket and wear non-slip shoes today.',
    },
  ],
  task: async (input) => generateTravelTip(input),
  scorers: [TipLength, Levenshtein],
});
