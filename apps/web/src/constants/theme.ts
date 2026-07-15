export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  TOGGLE: 'toggle',
} as const;

export type Theme = (typeof THEME)[keyof Omit<typeof THEME, 'TOGGLE'>];

export const THEME_STORAGE_KEY = 'vite-ui-theme';
