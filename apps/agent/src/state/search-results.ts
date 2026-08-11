import { z } from 'zod';

// Schemas
import {
  FlightSearchResultSchema,
  HotelSearchResultSchema,
  PlacesSearchResultSchema,
  RouteResultSchema,
  TipsResultSchema,
  WeatherResultSchema,
} from '@/schemas';

export const SearchResultsSchema = z.object({
  weather: WeatherResultSchema.optional(),
  flights: FlightSearchResultSchema.optional(),
  hotels: HotelSearchResultSchema.optional(),
  places: PlacesSearchResultSchema.optional(),
  route: RouteResultSchema.optional(),
  localTips: TipsResultSchema.optional(),
});
export type SearchResults = z.infer<typeof SearchResultsSchema>;

export const SearchResultsUpdateSchema = SearchResultsSchema.partial();

export const mergeSearchResults = (
  current: SearchResults,
  update: Partial<SearchResults>
): SearchResults => ({ ...current, ...update });
