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

export const TipsInputSchema = z.object({
  city: z.string().optional().describe('City name to get tips for, e.g. "Da Nang"'),
  country: z
    .string()
    .optional()
    .describe('Country name — used when no city is specified, e.g. "Vietnam"'),
  category: TipCategorySchema.optional().describe(
    'Filter tips by category: transport, money, safety, culture, food, connectivity, health, etiquette, best_time, language'
  ),
  essential_only: z
    .boolean()
    .optional()
    .describe('Return only must-know essential tips (default false)'),
});

export const ApiTipSchema = z.object({
  id: z.string(),
  category: TipCategorySchema,
  scope: z.enum(['country', 'city']),
  title: z.string(),
  content: z.string(),
  is_essential: z.boolean(),
  location: z.string().nullable().optional(),
});

export const ApiTipsResponseSchema = z.object({
  city: z.string().optional(),
  country: z.string(),
  count: z.number(),
  summary: z.string(),
  tips: z.array(ApiTipSchema),
});

export type TipsInput = z.infer<typeof TipsInputSchema>;
export type ApiTip = z.infer<typeof ApiTipSchema>;
export type ApiTipsResponse = z.infer<typeof ApiTipsResponseSchema>;

// Tool output — was reused from @repo/schemas, now inlined for full independence
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
