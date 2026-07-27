export const ONE_DAY_MS = 86_400_000;

export type DateGroupKey = 'today' | 'yesterday' | 'older';

export const DATE_GROUP_KEYS: DateGroupKey[] = ['today', 'yesterday', 'older'];

export const DATE_GROUP_LABELS: Record<DateGroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  older: 'Older',
};

export const SIDEBAR_WIDTH_COLLAPSED = 'w-14';
export const SIDEBAR_WIDTH_EXPANDED = 'w-64';
export const SIDEBAR_SHORTCUT_KEY = 'k';
export const SIDEBAR_NEW_CHAT_FALLBACK = 'New chat';
export const THREAD_PAGE_SIZE = 10;
