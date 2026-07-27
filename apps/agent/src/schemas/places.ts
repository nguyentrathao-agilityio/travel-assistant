import { z } from 'zod';

export const PlacesCategorySchema = z.enum([
  'attraction',
  'restaurant',
  'cafe',
  'activity',
  'nightlife',
  'shopping',
]);

export const PlacesSortSchema = z.enum([
  'rating_desc',
  'rating_asc',
  'name',
  'price_asc',
  'price_desc',
  'reviews_desc',
]);

export const PlacesInputSchema = z.object({
  city: z.string().optional().describe('City name, e.g. "Da Nang" or "Hanoi"'),
  category: PlacesCategorySchema.optional().describe(
    'Filter by place category: attraction, restaurant, cafe, activity, nightlife, shopping'
  ),
  min_rating: z.string().optional().describe('Minimum rating 0-5; omit for no filter'),
  price_level: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .describe('Price level filter: 1=free/cheap … 4=luxury'),
  recommended: z.boolean().optional().describe('Return only editor-recommended places'),
  sort: PlacesSortSchema.optional().describe('Sort order'),
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
});

export const ApiPlaceSchema = z.object({
  id: z.string(),
  short_code: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  category: PlacesCategorySchema,
  description: z.string(),
  address: z.string(),
  rating: z.number(),
  review_count: z.number(),
  price_level: z.number(),
  opening_hours: z.string().nullable().optional(),
  image_url: z.string(),
  tags: z.array(z.string()),
  is_recommended: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const ApiPlacesSearchResponseSchema = z.object({
  total: z.number(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  results: z.array(ApiPlaceSchema),
  city: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  min_rating: z.number().nullable().optional(),
  price_level: z.number().nullable().optional(),
  recommended_only: z.boolean().optional(),
  sort: z.string().nullable().optional(),
});

export type PlacesInput = z.infer<typeof PlacesInputSchema>;
export type ApiPlace = z.infer<typeof ApiPlaceSchema>;
export type ApiPlacesSearchResponse = z.infer<typeof ApiPlacesSearchResponseSchema>;

// Tool output — was reused from @repo/schemas, now inlined for full independence
export const PlaceResultItemSchema = z.object({
  id: z.string(),
  shortCode: z.string(),
  name: z.string(),
  city: z.string(),
  country: z.string(),
  category: PlacesCategorySchema,
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
