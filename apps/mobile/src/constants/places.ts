import type { PlaceCategory } from '@repo/types';

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  attraction: '🏛️ Attraction',
  restaurant: '🍽️ Restaurant',
  cafe: '☕ Cafe',
  activity: '🎯 Activity',
  nightlife: '🎉 Nightlife',
  shopping: '🛍️ Shopping',
};

export const PLACE_PRICE_LABELS: Record<number, string> = {
  1: 'Free',
  2: '$',
  3: '$$',
  4: '$$$',
};

export const PLACE_PRICE_LABEL_FALLBACK = '$';
