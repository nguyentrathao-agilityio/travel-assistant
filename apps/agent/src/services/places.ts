import { z } from 'zod';

// Schemas
import {
  PlacesInputSchema,
  ApiPlacesSearchResponseSchema,
  type PlacesSearchResult,
  type PlaceResultItem,
  type ApiPlace,
} from '@/schemas';

// Constants
import { API_URL, ENDPOINTS } from '@/constants';

// Utils
import { fetchAndValidate } from '@/utils/http';

const mapPlace = (place: ApiPlace): PlaceResultItem => ({
  id: place.id,
  shortCode: place.short_code,
  name: place.name,
  city: place.city,
  country: place.country,
  category: place.category,
  description: place.description,
  address: place.address,
  rating: place.rating,
  reviewCount: place.review_count,
  priceLevel: place.price_level,
  openingHours: place.opening_hours ?? undefined,
  imageUrl: place.image_url,
  tags: place.tags,
  isRecommended: place.is_recommended,
  latitude: place.latitude,
  longitude: place.longitude,
});

/**
 * Searches places of interest in a city with optional category and price filters.
 */
export const getPlaces = async (
  input: z.infer<typeof PlacesInputSchema>
): Promise<PlacesSearchResult> => {
  const params = Object.fromEntries(
    Object.entries({
      city: input.city,
      category: input.category,
      min_rating: input.min_rating?.toString(),
      price_level: input.price_level?.toString(),
      recommended: input.recommended ? 'true' : undefined,
      sort: input.sort ?? 'rating_desc',
      limit: String(input.limit ?? 20),
      offset: String(input.offset ?? 0),
    }).filter((entry): entry is [string, string] => !!entry[1])
  );

  const url = `${API_URL}${ENDPOINTS.PLACES_SEARCH}?${new URLSearchParams(params)}`;
  const data = await fetchAndValidate(url, ApiPlacesSearchResponseSchema);

  return {
    total: data.total,
    city: data.city ?? undefined,
    category: data.category ?? undefined,
    results: data.results.map(mapPlace),
  };
};
