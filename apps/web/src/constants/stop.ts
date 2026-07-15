import { Bike, Bus, Car, Footprints, Plane, Train, type LucideIcon } from 'lucide-react';

// Types
import type { TipCategory, TravelTransport } from '@repo/types';

export const TRAVEL_TRANSPORT = {
  WALK: 'walk',
  MOTORBIKE: 'motorbike',
  TAXI: 'taxi',
  BUS: 'bus',
  TRAIN: 'train',
  FLIGHT: 'flight',
  DRIVE: 'drive',
} as const satisfies Record<string, TravelTransport>;

export const TRAVEL_TRANSPORT_MAP: Record<TravelTransport, { icon: LucideIcon; label: string }> = {
  walk: { icon: Footprints, label: 'Walk' },
  motorbike: { icon: Bike, label: 'Motorbike' },
  taxi: { icon: Car, label: 'Taxi' },
  bus: { icon: Bus, label: 'Bus' },
  train: { icon: Train, label: 'Train' },
  flight: { icon: Plane, label: 'Flight' },
  drive: { icon: Car, label: 'Drive' },
};

export const TIP_CATEGORY_CLASS_MAP: Record<TipCategory, string> = {
  transport: 'bg-badge-primary-bg text-badge-primary-text',
  money: 'bg-badge-warning-bg text-badge-warning-text',
  safety: 'bg-badge-success-bg text-badge-success-text',
  culture: 'bg-badge-accent-bg text-badge-accent-text',
  food: 'bg-badge-danger-bg text-badge-danger-text',
  connectivity: 'bg-badge-secondary-bg text-badge-secondary-text',
  health: 'bg-badge-secondary-bg text-badge-secondary-text',
  etiquette: 'bg-badge-accent-bg text-badge-accent-text',
  best_time: 'bg-badge-warning-bg text-badge-warning-text',
  language: 'bg-badge-accent-bg text-badge-accent-text',
};
