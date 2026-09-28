import { Building2, Compass, MapPin, Plane } from 'lucide-react-native';

// Utils
import { shellSpacing } from '../theme';

// Types
import type { LucideIcon } from 'lucide-react-native';

export const CHAT_COMPOSER_INPUT_NATIVE_ID = 'chat-composer-input';

export const MIN_COMPOSER_INPUT_HEIGHT = 40;
export const COMPOSER_BOTTOM_MARGIN = shellSpacing.xs;

export const STOP_GENERATION_RETRY_DELAY_MS = 1_200;

export const MAX_VISIBLE_SUGGESTIONS = 3;

export const EMPTY_STATE_SUGGESTIONS: Array<{
  description: string;
  icon: LucideIcon;
  message: string;
  title: string;
}> = [
  {
    description: 'Trip Summary for Da Nang',
    icon: Compass,
    message: 'Trip Summary for Da Nang',
    title: 'Plan my trip',
  },
  {
    description: 'Find places to visit in Da Nang',
    icon: MapPin,
    message: 'Show me places to visit in Da Nang',
    title: 'Find places',
  },
  {
    description: 'Find hotels in Hoi An',
    icon: Building2,
    message: 'Show hotels in Hoi An',
    title: 'Find hotels',
  },
  {
    description: 'Find flights to Bangkok',
    icon: Plane,
    message: 'Find flights to Bangkok',
    title: 'Find flights',
  },
];

export const DESTINATION_PILLS = ['Da Nang', 'Hanoi', 'Bangkok', 'Tokyo'] as const;

// FlatList render window for chat: fewer mounted cards/images than the RN default (21 viewports).
export const CHAT_LIST_WINDOW_SIZE = 7;
export const CHAT_LIST_INITIAL_NUM_TO_RENDER = 12;
export const CHAT_LIST_MAX_TO_RENDER_PER_BATCH = 8;
