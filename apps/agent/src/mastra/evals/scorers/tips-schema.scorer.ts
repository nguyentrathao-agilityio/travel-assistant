const VALID_CATEGORIES = ['safety', 'money', 'transport', 'culture', 'health', 'connectivity'];
const REQUIRED_FIELDS = ['id', 'category', 'scope', 'title', 'content', 'isEssential'];

export const TipsSchema = ({ output }: { output: unknown[] }) => {
  const tips = output ?? [];

  const checks = [
    tips.length === 6,
    tips.filter((t: any) => t.isEssential === true).length === 2,
    tips.every((t: any) => REQUIRED_FIELDS.every((f) => f in t)),
    tips.every((t: any) => VALID_CATEGORIES.includes(t.category)),
    tips.every((t: any) => typeof t.title === 'string' && t.title.length > 0),
    tips.every((t: any) => typeof t.content === 'string' && t.content.length > 0),
  ];

  return {
    name: 'TipsSchema',
    score: checks.filter(Boolean).length / checks.length,
  };
};
