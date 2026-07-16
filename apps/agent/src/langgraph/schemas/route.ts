import { z } from 'zod';

import { DEFAULT_STOPS } from '../constants';

export const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  category: z.string(),
  description: z.string(),
  opening_hours: z.string().optional(),
  price_level: z.number(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const PlacesResultSchema = z.object({ results: z.array(PlaceSchema) });

export const RouteLegApiSchema = z.object({
  straight_line_km: z.number(),
  recommended_mode: z.string(),
  legs: z
    .array(
      z.object({
        mode: z.string(),
        distance_km: z.number(),
        duration_minutes: z.number(),
      })
    )
    .default([]),
});

export const RouteInputSchema = z.object({
  city: z.string().describe('City to build the tour for, e.g. "Da Nang" or "Hanoi"'),
  maxStops: z
    .number()
    .int()
    .min(2)
    .max(8)
    .optional()
    .default(DEFAULT_STOPS)
    .describe('Maximum number of stops (2-8), defaults to 5'),
});

export type Place = z.infer<typeof PlaceSchema>;
export type RouteLegApi = z.infer<typeof RouteLegApiSchema>;
export type RouteInput = z.infer<typeof RouteInputSchema>;

// Tool output — was reused from @repo/schemas, now inlined for full independence
export const LandmarkStopSchema = z.object({
  name: z.string(),
  city: z.string(),
  description: z.string().optional(),
  visitDurationMin: z.number().optional(),
  openingHours: z.string().optional(),
  entranceFee: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const TourLegSchema = z.object({
  mode: z.enum(['walk', 'motorbike', 'taxi', 'bus', 'train', 'flight', 'drive']),
  durationMin: z.number(),
  distanceKm: z.number(),
});

export const RouteResultSchema = z.object({
  city: z.string(),
  totalDurationMin: z.number(),
  stops: z.array(LandmarkStopSchema),
  legs: z.array(TourLegSchema),
  travelTip: z.string().optional(),
});

export type LandmarkStop = z.infer<typeof LandmarkStopSchema>;
export type TourLeg = z.infer<typeof TourLegSchema>;
export type TransportMode = z.infer<typeof TourLegSchema>['mode'];
export type RouteResult = z.infer<typeof RouteResultSchema>;
