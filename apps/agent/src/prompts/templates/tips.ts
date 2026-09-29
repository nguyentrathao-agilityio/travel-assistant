interface TipsPromptInput {
  categories: readonly string[];
  essentialTipCount: number;
  location: string;
  locationLabel: string;
  scope: string;
  summary: string;
  tipCount: number;
}

export const buildTipsPrompt = ({
  categories,
  essentialTipCount,
  location,
  locationLabel,
  scope,
  summary,
  tipCount,
}: TipsPromptInput): string => `Generate ${tipCount} practical travel tips for ${location}.
Background: ${summary}

Return a JSON object with this exact shape:
{
  "tips": [
    {
      "id": "llm-1",
      "category": "<one of: ${categories.join(', ')}>",
      "scope": "${scope}",
      "title": "<short title, max 8 words>",
      "content": "<practical tip, 1-2 sentences>",
      "isEssential": <true or false>,
      "location": "${locationLabel}"
    }
  ]
}

Cover a variety of categories. Mark exactly ${essentialTipCount} tips as essential.`;
