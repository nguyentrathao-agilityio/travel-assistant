import { z } from 'zod';

export const TipCategorySchema = z.enum([
  'transport',
  'money',
  'safety',
  'culture',
  'food',
  'connectivity',
  'health',
  'etiquette',
  'best_time',
  'language',
]);

export const TipItemSchema = z.object({
  id: z.string(),
  category: TipCategorySchema,
  scope: z.enum(['country', 'city']),
  title: z.string(),
  content: z.string(),
  isEssential: z.boolean(),
  location: z.string().nullable(),
});

export const TipsResultSchema = z.object({
  city: z.string().optional(),
  country: z.string(),
  count: z.number(),
  summary: z.string(),
  tips: z.array(TipItemSchema),
});

export type TipItem = z.infer<typeof TipItemSchema>;
export type TipsResult = z.infer<typeof TipsResultSchema>;
