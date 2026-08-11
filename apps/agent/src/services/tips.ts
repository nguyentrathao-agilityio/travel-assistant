import { z } from 'zod';

// Schemas
import {
  TipCategorySchema,
  TipsInputSchema,
  ApiTipsResponseSchema,
  type TipsResult,
  type TipItem,
  type ApiTip,
} from '@/schemas';

// Constants
import { API_URL, ENDPOINTS } from '@/constants';

// Infrastructure
import { getOpenAIClient, OPENAI_CLIENT_MODEL } from '@/infrastructure/llm';

const VALID_CATEGORIES = TipCategorySchema.options;
const LLM_TIPS_COUNT = 6;
const LLM_ESSENTIAL_TIPS_COUNT = 2;

const LLMTipSchema = z.object({
  id: z.string(),
  category: TipCategorySchema,
  scope: z.enum(['country', 'city']),
  title: z.string(),
  content: z.string(),
  isEssential: z.boolean(),
  location: z.string().nullable(),
});

const LLMTipsResponseSchema = z.object({
  tips: z.array(LLMTipSchema),
});

/** Maps a raw API tip to the shared TipItem shape. */
const mapTip = (tip: ApiTip): TipItem => ({
  id: tip.id,
  category: tip.category,
  scope: tip.scope,
  title: tip.title,
  content: tip.content,
  isEssential: tip.is_essential,
  location: tip.location ?? null,
});

/** Strips markdown code fences from a string, returning the inner content. */
const stripCodeFences = (text: string): string => {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  return match ? match[1].trim() : text;
};

/**
 * Uses OpenAI to generate structured travel tips when the API returns none.
 */
export const generateTipsFromLLM = async (
  city: string | undefined,
  country: string,
  summary: string
): Promise<TipItem[]> => {
  try {
    const location = city ? `${city}, ${country}` : country;
    const scope = city ? 'city' : 'country';

    const response = await getOpenAIClient().responses.create({
      model: OPENAI_CLIENT_MODEL,
      text: { format: { type: 'json_object' } },
      input: `Generate ${LLM_TIPS_COUNT} practical travel tips for ${location}.
              Background: ${summary}

              Return a JSON object with this exact shape:
              {
                "tips": [
                  {
                    "id": "llm-1",
                    "category": "<one of: ${VALID_CATEGORIES.join(', ')}>",
                    "scope": "${scope}",
                    "title": "<short title, max 8 words>",
                    "content": "<practical tip, 1-2 sentences>",
                    "isEssential": <true or false>,
                    "location": "${city ?? country}"
                  }
                ]
              }

              Cover a variety of categories. Mark exactly ${LLM_ESSENTIAL_TIPS_COUNT} tips as essential.`,
    });

    const raw = JSON.parse(stripCodeFences(response.output_text.trim()));
    const parsed = LLMTipsResponseSchema.safeParse(raw);

    if (!parsed.success) {
      console.error('LLM tips validation failed:', parsed.error.flatten());
      return [];
    }

    return parsed.data.tips;
  } catch (error) {
    console.error('Failed to generate LLM tips:', error);
    return [];
  }
};

/**
 * Fetches local travel tips for a city or country.
 * Falls back to LLM-generated tips when the API returns none.
 */
export const getLocalTips = async (input: z.infer<typeof TipsInputSchema>): Promise<TipsResult> => {
  const params = Object.fromEntries(
    Object.entries({
      city: input.city,
      country: input.country,
      category: input.category,
      essential_only: input.essential_only ? 'true' : undefined,
    }).filter((entry): entry is [string, string] => !!entry[1])
  );

  const url = `${API_URL}${ENDPOINTS.TIPS}?${new URLSearchParams(params)}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (cause) {
    throw new Error(`Network request failed: ${url}`, { cause });
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status} ${res.statusText}: ${url}`);
  }

  const raw = await res.json();
  const parsed = ApiTipsResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid response from ${url}: ${parsed.error.message}`);
  }

  const data = parsed.data;
  const apiTips = data.tips.map(mapTip);
  const tips = apiTips?.length
    ? apiTips
    : await generateTipsFromLLM(data.city, data.country, data.summary);

  return {
    city: data.city,
    country: data.country,
    count: tips.length,
    summary: data.summary,
    tips,
  };
};
