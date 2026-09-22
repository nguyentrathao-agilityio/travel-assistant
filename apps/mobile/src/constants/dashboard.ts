export const GRID_ROW_HEIGHT = 232;
export const RECENT_ICONS = ['🧭', '💡', '🎧', '❤️', '🖼️'];
export const THREAD_PAGE_SIZE = 10;

export const THREAD_LIST_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type ThreadListStatus = (typeof THREAD_LIST_STATUS)[keyof typeof THREAD_LIST_STATUS];
export const BOTTOM_NAV_CLEARANCE = 104;
