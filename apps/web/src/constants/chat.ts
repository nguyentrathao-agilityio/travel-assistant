import { Building2, Compass, MapPin, Plane } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SuggestionItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  message: string;
};

export const PRIMARY_SUGGESTION: SuggestionItem = {
  icon: Compass,
  title: 'Plan my trip',
  description: 'Trip Summary for Da Nang',
  message: 'Trip Summary for Da Nang',
};

export const SECONDARY_SUGGESTIONS: SuggestionItem[] = [
  {
    icon: MapPin,
    title: 'Find places',
    description: 'Find places to visit in Da Nang',
    message: 'Show me places to visit in Da Nang',
  },
  {
    icon: Building2,
    title: 'Find hotels',
    description: 'Find hotels in Hoi An',
    message: 'Show hotels in Hoi An',
  },
  {
    icon: Plane,
    title: 'Find flights',
    description: 'Find flights to Bangkok',
    message: 'Find flights to Bangkok',
  },
];

export const DESTINATION_PILLS = ['Da Nang', 'Hanoi', 'Bangkok', 'Tokyo'] as const;

export type DestinationPill = (typeof DESTINATION_PILLS)[number];

export const MAX_CHAT_TEXTAREA_HEIGHT = 160;
export const COPY_FEEDBACK_DURATION_MS = 2_000;
export const STOP_GENERATION_RETRY_DELAY_MS = 1_200;
