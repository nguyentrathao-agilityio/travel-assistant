export type {
  LandmarkStop,
  TourLeg,
  RouteResult,
  TransportMode as TravelTransport,
} from '@repo/schemas';

import type { RouteResult, TransportMode } from '@repo/schemas';

export type LandmarkTourRoute = RouteResult;

export interface TravelLeg {
  transport: TransportMode;
  durationMin: number;
  distanceKm?: number;
}

export type TipCategory =
  | 'transport'
  | 'money'
  | 'safety'
  | 'culture'
  | 'food'
  | 'connectivity'
  | 'health'
  | 'etiquette'
  | 'best_time'
  | 'language';

export interface Tip {
  id: string;
  category: TipCategory;
  scope: 'country' | 'city';
  title: string;
  content: string;
  isEssential: boolean;
  location?: string | null;
}

export interface TipsResult {
  city?: string;
  country: string;
  count: number;
  summary: string;
  tips: Tip[];
}
