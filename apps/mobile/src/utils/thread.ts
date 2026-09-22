// Constants
import { RECENT_ICONS } from '../constants';

// Types
import type { ThreadItem } from '../services';

export const threadLabel = (thread: ThreadItem): string => thread.title ?? 'Untitled trip';

export const getRecentIcon = (index: number): string => RECENT_ICONS[index % RECENT_ICONS.length];
