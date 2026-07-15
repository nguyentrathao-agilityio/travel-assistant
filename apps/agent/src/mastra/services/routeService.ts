// Constants
import {
  API_URL,
  ENDPOINTS,
  VISIT_DURATION_MIN,
  DEFAULT_STOPS,
  MAX_STOPS_LIMIT,
} from '@/constants';

// Schemas
import type { RouteResult, LandmarkStop, TourLeg } from '@repo/schemas';
import { PlacesResultSchema, RouteLegApiSchema } from '@/schemas';

// Utils
import { apiFetch, apiFetchOrNull, mapRouteMode } from '@/utils';

/**
 * Builds a landmark tour itinerary for a city with ordered stops and travel times.
 */
export const getRoute = async (inputData: {
  city: string;
  maxStops?: number;
}): Promise<RouteResult> => {
  const { city, maxStops = DEFAULT_STOPS } = inputData;

  const placesData = await apiFetch(`${API_URL}${ENDPOINTS.PLACES_SEARCH}`, PlacesResultSchema, {
    city,
    recommended: 'true',
    sort: 'rating_desc',
    limit: String(Math.min(maxStops, MAX_STOPS_LIMIT)),
  });

  const places = placesData.results.slice(0, maxStops);
  if (places.length === 0) throw new Error(`No places found for ${city}`);

  const legPromises = places.slice(0, -1).map((place, i) =>
    apiFetchOrNull(`${API_URL}${ENDPOINTS.PLACES_ROUTE}`, RouteLegApiSchema, {
      origin: place.id,
      destination: places[i + 1].id,
    })
  );
  const routeResults = await Promise.all(legPromises);

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

  const totalDurationMin =
    stops.reduce((sum, stop) => sum + (stop.visitDurationMin ?? 0), 0) +
    legs.reduce((sum, leg) => sum + leg.durationMin, 0);

  return { city, totalDurationMin, stops, legs };
};
