import { z } from 'zod';

import { FlightSearchResultSchema } from '../schemas/flights';
import { HotelSearchResultSchema } from '../schemas/hotel';
import { PlacesSearchResultSchema } from '../schemas/places';
import { RouteResultSchema } from '../schemas/route';
import { TipsResultSchema } from '../schemas/tips';
import { WeatherResultSchema } from '../schemas/weather';

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
