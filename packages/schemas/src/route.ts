import { z } from 'zod';

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
