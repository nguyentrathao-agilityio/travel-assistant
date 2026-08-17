import {
  Wifi,
  Waves,
  ParkingCircle,
  Dumbbell,
  UtensilsCrossed,
  Wind,
  Tv,
  Coffee,
  type LucideIcon,
  Leaf,
} from 'lucide-react';

// Amenity to icon mapping
export const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  'free wifi': Wifi,
  pool: Waves,
  'swimming pool': Waves,
  parking: ParkingCircle,
  'free parking': ParkingCircle,
  gym: Dumbbell,
  'fitness center': Dumbbell,
  restaurant: UtensilsCrossed,
  'air conditioning': Wind,
  ac: Wind,
  tv: Tv,
  'flat screen': Tv,
  breakfast: Coffee,
  'free breakfast': Coffee,
  spa: Leaf,
};

// Get amenity icon by name
export const getAmenityIcon = (amenity: string): LucideIcon | null => {
  const key = amenity.toLowerCase().trim();

  return AMENITY_ICONS[key] || null;
};

// Get color for amenity chip (cycling through colors for variety)
export const getAmenityColor = (amenity: string, index: number): string => {
  const colors = [
    'bg-border-secondary/50 text-badge-primary-text',
    'bg-border-secondary/50 text-badge-success-text',
    'bg-border-secondary/50 text-badge-secondary-text',
    'bg-border-secondary/50 text-badge-warning-text',
    'bg-border-secondary/50 text-badge-accent-text',
  ];

  return colors[index % colors.length];
};

// Get rating color based on score
export const getRatingColor = (
  rating: number
): {
  bgClass: string;
  textClass: string;
} => {
  if (rating >= 4.5) {
    return {
      bgClass: 'bg-badge-success-bg',
      textClass: 'text-badge-success-text',
    };
  }

  if (rating >= 4) {
    return {
      bgClass: 'bg-badge-secondary-bg',
      textClass: 'text-badge-secondary-text',
    };
  }

  if (rating >= 3.5) {
    return {
      bgClass: 'bg-badge-primary-bg',
      textClass: 'text-badge-primary-text',
    };
  }

  if (rating >= 3) {
    return {
      bgClass: 'bg-badge-warning-bg',
      textClass: 'text-badge-warning-text',
    };
  }

  return {
    bgClass: 'bg-badge-danger-bg',
    textClass: 'text-badge-danger-text',
  };
};
