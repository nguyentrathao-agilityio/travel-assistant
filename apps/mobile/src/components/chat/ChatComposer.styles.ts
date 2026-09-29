import { StyleSheet } from 'react-native';

import { shellOpacity, shellRadii, shellSpacing } from '../../theme';

import type { ShellColors } from '../../theme';

export const createChatComposerStyles = (colors: ShellColors) =>
  StyleSheet.create({
    errorBanner: {
      backgroundColor: 'rgba(248, 113, 113, 0.16)',
      borderColor: colors.danger,
      borderRadius: shellRadii.card,
      borderWidth: 1,
      marginBottom: shellSpacing.sm,
      padding: shellSpacing.sm,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    voiceStatusBanner: {
      marginBottom: shellSpacing.sm,
    },
    voiceStatusText: {
      color: colors.textOnDarkMuted,
      fontSize: 13,
    },
    inputBar: {
      alignItems: 'center',
      backgroundColor: colors.pillBackground,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.row,
      borderWidth: 1,
      flexDirection: 'row',
      padding: shellSpacing.xs,
    },
    input: {
      backgroundColor: 'transparent',
      color: colors.textOnDark,
      flex: 1,
      fontSize: 15,
      maxHeight: 120,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm + 2,
    },
    sendButton: {
      alignItems: 'center',
      backgroundColor: colors.accentGradientStart,
      borderRadius: shellRadii.pill,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    sendButtonDisabled: {
      opacity: shellOpacity.disabledStrong,
    },
    stopButton: {
      alignItems: 'center',
      backgroundColor: colors.danger,
      borderRadius: shellRadii.pill,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
  });
