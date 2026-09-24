import { StyleSheet } from 'react-native';

import { shellRadii, shellSpacing } from '../theme';

import type { ShellColors } from '../theme';

export const createOnboardingScreenStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      paddingBottom: shellSpacing.lg,
      paddingHorizontal: shellSpacing.lg,
      paddingTop: shellSpacing.xl + shellSpacing.lg,
    },
    brandRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.xs,
      justifyContent: 'center',
    },
    brandName: {
      color: colors.textOnDark,
      fontSize: 22,
      fontWeight: '700',
      paddingTop: shellSpacing.md,
    },
    illustrationArea: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingTop: shellSpacing.md,
    },
    speechBubbleGroup: { alignItems: 'flex-end', alignSelf: 'stretch' },
    speechBubble: {
      backgroundColor: colors.surface,
      borderRadius: shellRadii.card,
      maxWidth: 240,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm + 2,
    },
    speechBubbleText: { color: colors.textOnDark, fontSize: 14, textAlign: 'center' },
    speechBubbleTail: { alignItems: 'flex-end', gap: 4, marginVertical: shellSpacing.sm },
    tailDot: { backgroundColor: colors.surface, borderRadius: shellRadii.pill },
    tailDotLarge: { height: 10, marginRight: 28, width: 10 },
    tailDotMedium: { height: 7, marginRight: 44, width: 7 },
    tailDotSmall: { height: 4, marginRight: 60, width: 4 },
    illustrationImage: { height: 270, marginTop: shellSpacing.xs, width: 290 },
    textBlock: { marginBottom: shellSpacing.lg },
    headline: { color: colors.textOnDark, fontSize: 27, fontWeight: '500', lineHeight: 36 },
    headlineAccent: { color: colors.accentGradientEnd, fontWeight: '700' },
    subcopy: { color: colors.textOnDarkMuted, fontSize: 14, marginTop: shellSpacing.sm },
    pagination: { flexDirection: 'row', gap: shellSpacing.xs, marginTop: shellSpacing.lg },
    dot: {
      backgroundColor: colors.surfaceBorder,
      borderRadius: shellRadii.pill,
      height: 4,
      width: 16,
    },
    dotActive: { backgroundColor: colors.accentGradientEnd, width: 24 },
    bottomRow: { alignItems: 'center', flexDirection: 'row', gap: shellSpacing.sm },
    backCircle: {
      alignItems: 'center',
      backgroundColor: colors.pillBackground,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.pill,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    continuePill: {
      alignItems: 'center',
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      flex: 1,
      flexDirection: 'row',
      height: 56,
      paddingHorizontal: shellSpacing.sm,
    },
    continueIconCircle: {
      alignItems: 'center',
      borderRadius: shellRadii.pill,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    continueLabel: {
      color: colors.textOnDark,
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    continueChevrons: { marginRight: shellSpacing.sm },
  });
