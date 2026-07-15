import { evalite } from 'evalite';

import { generateTipsFromLLM } from '../services/tipsService';
import { TipsSchema } from './scorers/tips-schema.scorer';

evalite('Tips LLM Generation', {
  data: async () => [
    {
      input: {
        city: undefined as string | undefined,
        country: 'Vietnam',
        summary:
          'Southeast Asian country known for its beaches, street food, history, and vibrant cities.',
      },
    },
    {
      input: {
        city: 'Tokyo',
        country: 'Japan',
        summary:
          'Island nation with rich culture, advanced technology, world-class cuisine, and unique traditions.',
      },
    },
    {
      input: {
        city: 'Paris',
        country: 'France',
        summary:
          'Western European country famous for art, fashion, cuisine, and romantic architecture.',
      },
    },
  ],
  task: async (input) => generateTipsFromLLM(input.city, input.country, input.summary),
  scorers: [TipsSchema],
});
