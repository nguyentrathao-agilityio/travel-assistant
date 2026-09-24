import { StyleSheet } from 'react-native';

import { shellSpacing } from '../../theme';

import type { ShellColors } from '../../theme';

export const createChatEmptyStateStyles = (colors: ShellColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: 92,
      paddingHorizontal: shellSpacing.md,
    },
    keyboardVisible: {
      justifyContent: 'flex-start',
      paddingTop: shellSpacing.xl,
    },
    titleWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: shellSpacing.xl,
    },
    title: {
      color: colors.textOnDark,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
    },
    description: {
      color: colors.textOnDarkMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: shellSpacing.sm,
      maxWidth: 340,
      textAlign: 'center',
    },
    destinationPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'center',
      marginTop: shellSpacing.md,
    },
    destinationPill: {
      alignItems: 'center',
      backgroundColor: `${colors.accentGradientEnd}2e`,
      borderColor: colors.surfaceBorder,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.xs,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    destinationPillLabel: {
      color: colors.textOnDark,
      fontSize: 12,
      fontWeight: '600',
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: shellSpacing.sm,
      width: '100%',
    },
    quickAction: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: 16,
      borderWidth: 1,
      flexBasis: '48%',
      flexDirection: 'row',
      flexGrow: 1,
      gap: shellSpacing.sm,
      minHeight: 72,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm,
    },
    quickActionCopy: {
      flex: 1,
      gap: shellSpacing.xs,
      justifyContent: 'center',
    },
    quickActionLabel: {
      color: colors.textOnDark,
      fontSize: 14,
      fontWeight: '600',
    },
    quickActionDescription: {
      color: colors.textOnDarkFaint,
      fontSize: 11,
      lineHeight: 15,
    },
  });
