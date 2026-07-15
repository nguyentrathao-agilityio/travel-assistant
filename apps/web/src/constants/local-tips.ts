export const TIP_CATEGORIES = {
  TRANSPORT: 'transport',
  MONEY: 'money',
  FOOD: 'food',
  SAFETY: 'safety',
  CULTURE: 'culture',
  BEST_TIME: 'best_time',
  LANGUAGE: 'language',
  CONNECTIVITY: 'connectivity',
  HEALTH: 'health',
  ETIQUETTE: 'etiquette',
} as const;

export type TipCategoryValue = (typeof TIP_CATEGORIES)[keyof typeof TIP_CATEGORIES];

export const TIP_CATEGORY_VALUES = Object.values(TIP_CATEGORIES);

export const TIP_CATEGORY_OPTIONS = [
  { value: TIP_CATEGORIES.TRANSPORT, label: '🚌 Transport' },
  { value: TIP_CATEGORIES.MONEY, label: '💰 Money' },
  { value: TIP_CATEGORIES.FOOD, label: '🍜 Food' },
  { value: TIP_CATEGORIES.SAFETY, label: '🛡️ Safety' },
  { value: TIP_CATEGORIES.CULTURE, label: '🎭 Culture' },
  { value: TIP_CATEGORIES.BEST_TIME, label: '📅 Best time' },
  { value: TIP_CATEGORIES.LANGUAGE, label: '🗣️ Language' },
  { value: TIP_CATEGORIES.CONNECTIVITY, label: '📶 Connectivity' },
  { value: TIP_CATEGORIES.HEALTH, label: '🏥 Health' },
  { value: TIP_CATEGORIES.ETIQUETTE, label: '🤝 Etiquette' },
] as const;

export const TIP_CATEGORY_LABELS: Record<TipCategoryValue, string> = {
  transport: '🚌 Transport',
  money: '💰 Money',
  food: '🍜 Food',
  safety: '🛡️ Safety',
  culture: '🎭 Culture',
  best_time: '📅 Best time',
  language: '🗣️ Language',
  connectivity: '📶 Connectivity',
  health: '🏥 Health',
  etiquette: '🤝 Etiquette',
};
