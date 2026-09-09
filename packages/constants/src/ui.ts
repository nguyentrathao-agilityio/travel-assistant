export const OPENAI_API_KEY_HEADER = 'x-openai-api-key';

export const FLIGHT_LOW_SEATS_THRESHOLD = 9;

export const FLIGHT_TAB = {
  DEPARTURE: 'departure',
  RETURN: 'return',
} as const;

export type FlightTab = (typeof FLIGHT_TAB)[keyof typeof FLIGHT_TAB];

export const HOTEL_AMENITIES_MAX_DISPLAY = 5;
export const WEATHER_FORECAST_MAX_DAYS = 16;

export const PLACE_CATEGORY_LABELS = {
  attraction: '🏛️ Attraction',
  restaurant: '🍽️ Restaurant',
  cafe: '☕ Cafe',
  activity: '🎯 Activity',
  nightlife: '🎉 Nightlife',
  shopping: '🛒 Shopping',
} as const;

export const PLACE_PRICE_LABELS: Readonly<Record<number, string>> = {
  1: 'Free',
  2: '$',
  3: '$$',
  4: '$$$',
};

export const PLACE_PRICE_LABEL_FALLBACK = '$';

export const TIP_CATEGORY_LABELS = {
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
} as const;
