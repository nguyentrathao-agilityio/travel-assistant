import { z } from 'zod';

export const PlaceCategorySchema = z.enum([
  'attraction',
  'restaurant',
  'cafe',
  'activity',
  'nightlife',
  'shopping',
]);

export const PlaceResultItemSchema = z.object({
  id: z.string(),
  shortCode: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  category: PlaceCategorySchema,
  description: z.string(),
  address: z.string(),
  rating: z.number(),
  reviewCount: z.number(),
  priceLevel: z.number(),
  openingHours: z.string().optional(),
  imageUrl: z.string(),
  tags: z.array(z.string()),
  isRecommended: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const PlacesSearchResultSchema = z.object({
  total: z.number(),
  city: z.string().optional(),
  category: z.string().optional(),
  results: z.array(PlaceResultItemSchema),
});

export type PlaceResultItem = z.infer<typeof PlaceResultItemSchema>;
export type PlacesSearchResult = z.infer<typeof PlacesSearchResultSchema>;
