export type ShellColors = typeof darkShellColors;

export const darkShellColors = {
  backgroundGradientStart: '#1b0b34',
  backgroundGradientEnd: '#3a0f5c',
  accentGradientStart: '#a21caf',
  accentGradientEnd: '#ec4899',
  surface: 'rgba(255, 255, 255, 0.07)',
  surfaceBorder: 'rgba(255, 255, 255, 0.14)',
  iconBadgeBackground: 'rgba(0, 0, 0, 0.32)',
  pillBackground: '#241141',
  bubbleUserBackground: '#a21caf',
  textOnDark: '#f5f3ff',
  textOnDarkMuted: '#c9b8e8',
  textOnDarkFaint: '#8a7aad',
  danger: '#f87171',
};

export const lightShellColors: ShellColors = {
  backgroundGradientStart: '#faf5ff',
  backgroundGradientEnd: '#f3e8ff',
  accentGradientStart: '#a21caf',
  accentGradientEnd: '#ec4899',
  surface: 'rgba(0, 0, 0, 0.05)',
  surfaceBorder: 'rgba(0, 0, 0, 0.12)',
  iconBadgeBackground: 'rgba(255, 255, 255, 0.7)',
  pillBackground: '#ffffff',
  bubbleUserBackground: '#f0d6f7',
  textOnDark: '#2a1246',
  textOnDarkMuted: '#6b4d8f',
  textOnDarkFaint: '#9c86b8',
  danger: '#dc2626',
};

export const shellRadii = {
  card: 20,
  row: 28,
  pill: 999,
  button: 16,
};

export const shellSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
