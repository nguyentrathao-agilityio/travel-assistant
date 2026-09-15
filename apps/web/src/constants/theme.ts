import type { THEME_VALUES } from '@repo/constants';

export type Theme = (typeof THEME_VALUES)[keyof Omit<typeof THEME_VALUES, 'TOGGLE'>];

export const THEME_STORAGE_KEY = 'vite-ui-theme';
