import { z } from 'zod';
import { getOpenAIClient, OPENAI_CLIENT_MODEL } from './openaiClient';

export type DailyRates = { food: number; activities: number; transport: number };

const DailyRatesSchema = z.object({
  food: z.number(),
  activities: z.number(),
  transport: z.number(),
});

const FALLBACK_RATES: DailyRates = { food: 35, activities: 40, transport: 12 };

export const estimateDailyCosts = async (destination: string): Promise<DailyRates> => {
  try {
    const response = await getOpenAIClient().responses.create({
      model: OPENAI_CLIENT_MODEL,
      input: `Estimate typical daily travel costs in USD for a tourist in ${destination}.`,
      text: {
        format: {
          type: 'json_schema',
          name: 'daily_rates',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              food: { type: 'number', description: 'Daily food cost per person' },
              activities: { type: 'number', description: 'Daily activities & entrance fees' },
              transport: { type: 'number', description: 'Daily local transport' },
            },
            required: ['food', 'activities', 'transport'],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = DailyRatesSchema.safeParse(JSON.parse(response.output_text));
    return parsed.success ? parsed.data : FALLBACK_RATES;
  } catch {
    return FALLBACK_RATES;
  }
};
