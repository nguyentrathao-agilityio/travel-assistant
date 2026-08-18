// Schemas
import {
  PlacesResultSchema,
  RouteLegApiSchema,
  type RouteResult,
  type LandmarkStop,
  type TourLeg,
  type TransportMode,
  type RouteLegApi,
} from '@/schemas';

// Constants
import {
  API_URL,
  ENDPOINTS,
  VISIT_DURATION_MIN,
  DEFAULT_STOPS,
  MAX_STOPS_LIMIT,
  PLACES_SORT,
  ROUTE_MODE_MAP,
} from '@/constants';

// Utils
import { fetchAndValidate } from '@/utils/http';

const mapRouteMode = (mode: string): TransportMode =>
  (ROUTE_MODE_MAP[mode] as TransportMode) ?? 'taxi';

/** Fetches a single leg between two places, returning null on any failure. */
const fetchRouteLeg = async (origin: string, destination: string): Promise<RouteLegApi | null> => {
  const url = `${API_URL}${ENDPOINTS.PLACES_ROUTE}?${new URLSearchParams({ origin, destination })}`;

  try {
    return await fetchAndValidate(url, RouteLegApiSchema);
  } catch {
    return null;
  }
};

/**
 * Builds a landmark tour itinerary for a city with ordered stops and travel times.
 */
export const getRoute = async (inputData: {
  city: string;
  maxStops?: number;
}): Promise<RouteResult> => {
  // Fetch the highest-rated landmarks within the requested stop limit.
  const { city, maxStops = DEFAULT_STOPS } = inputData;

  const placesUrl = `${API_URL}${ENDPOINTS.PLACES_SEARCH}?${new URLSearchParams({
    city,
    recommended: 'true',
    sort: PLACES_SORT.RATING_DESC,
    limit: String(Math.min(maxStops, MAX_STOPS_LIMIT)),
  })}`;

  const placesData = await fetchAndValidate(placesUrl, PlacesResultSchema);
  const places = placesData.results.slice(0, maxStops);

  if (places.length === 0) throw new Error(`No places found for ${city}`);

  // Resolve travel legs concurrently while preserving landmark order.
  const legPromises = places
    .slice(0, -1)
    .map((place, i) => fetchRouteLeg(place.id, places[i + 1].id));
  const routeResults = await Promise.all(legPromises);

  // Normalize place and route responses into the itinerary contract.
  const stops: LandmarkStop[] = places.map((place) => ({
    name: place.name,
    city: place.city,
    description: place.description,
    visitDurationMin: VISIT_DURATION_MIN[place.category],
    openingHours: place.opening_hours ?? 'Check locally',
    lat: place.latitude,
    lng: place.longitude,
  }));

  const legs: TourLeg[] = routeResults
    .map((route): TourLeg | null => {
      if (!route) return null;

      const bestLeg =
        route.legs.find((leg) => leg.mode === route.recommended_mode) ?? route.legs[0];

      if (!bestLeg) return null;

      return {
        mode: mapRouteMode(route.recommended_mode),
        durationMin: bestLeg.duration_minutes,
        distanceKm: bestLeg.distance_km,
      };
    })
    .filter((leg): leg is TourLeg => leg !== null);

  // Combine visit and travel time into the complete tour duration.
  const totalDurationMin =
    stops.reduce((sum, stop) => sum + (stop.visitDurationMin ?? 0), 0) +
    legs.reduce((sum, leg) => sum + leg.durationMin, 0);

  return { city, totalDurationMin, stops, legs };
};
