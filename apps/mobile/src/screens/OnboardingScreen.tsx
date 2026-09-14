import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../theme';

// Types
import type { ShellColors } from '../theme';

interface OnboardingScreenProps {
  onContinue: () => void;
}

export const OnboardingScreen = ({ onContinue }: OnboardingScreenProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={styles.brandRow}>
        <Text style={styles.brandMark}>◔</Text>
        <Text style={styles.brandName}>Travel Planner</Text>
      </View>

      <View style={styles.illustrationArea}>
        <View style={styles.speechBubble}>
          <Text style={styles.speechBubbleText}>How can I help you plan your trip?</Text>
        </View>
        <View style={styles.speechBubbleTail}>
          <View style={[styles.tailDot, styles.tailDotLarge]} />
          <View style={[styles.tailDot, styles.tailDotMedium]} />
          <View style={[styles.tailDot, styles.tailDotSmall]} />
        </View>

        <LinearGradient
          colors={[colors.accentGradientStart, colors.accentGradientEnd]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.illustrationBadge}
        >
          <Text style={styles.illustrationEmoji}>🧭</Text>
        </LinearGradient>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.headline}>
          Smarter Trips Start Here — Meet Your <Text style={styles.headlineAccent}>Assistant</Text>
        </Text>
        <Text style={styles.subcopy}>Say hello to your new travel companion!</Text>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={onContinue} style={styles.continuePill}>
        <LinearGradient
          colors={[colors.accentGradientStart, colors.accentGradientEnd]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.continueIconCircle}
        >
          <Text style={styles.continueIconText}>→</Text>
        </LinearGradient>
        <Text style={styles.continueLabel}>Continue</Text>
        <Text style={styles.continueChevrons}>›››</Text>
      </Pressable>
    </LinearGradient>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      paddingBottom: shellSpacing.xl,
      paddingHorizontal: shellSpacing.xl,
      paddingTop: shellSpacing.xl * 2,
    },
    brandRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.xs,
    },
    brandMark: {
      color: colors.textOnDark,
      fontSize: 18,
    },
    brandName: {
      color: colors.textOnDark,
      fontSize: 17,
      fontWeight: '700',
    },
    illustrationArea: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    speechBubble: {
      backgroundColor: colors.surface,
      borderRadius: shellRadii.card,
      maxWidth: 240,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.sm + 2,
    },
    speechBubbleText: {
      color: colors.textOnDark,
      fontSize: 14,
      textAlign: 'center',
    },
    speechBubbleTail: {
      alignItems: 'center',
      gap: 4,
      marginVertical: shellSpacing.sm,
    },
    tailDot: {
      backgroundColor: colors.surface,
      borderRadius: shellRadii.pill,
    },
    tailDotLarge: {
      height: 10,
      width: 10,
    },
    tailDotMedium: {
      height: 7,
      width: 7,
    },
    tailDotSmall: {
      height: 4,
      width: 4,
    },
    illustrationBadge: {
      alignItems: 'center',
      borderRadius: 32,
      height: 160,
      justifyContent: 'center',
      marginTop: shellSpacing.md,
      width: 160,
    },
    illustrationEmoji: {
      fontSize: 68,
    },
    textBlock: {
      marginBottom: shellSpacing.lg,
    },
    headline: {
      color: colors.textOnDark,
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 34,
    },
    headlineAccent: {
      color: colors.accentGradientEnd,
    },
    subcopy: {
      color: colors.textOnDarkMuted,
      fontSize: 14,
      marginTop: shellSpacing.sm,
    },
    pagination: {
      flexDirection: 'row',
      gap: shellSpacing.xs,
      marginTop: shellSpacing.lg,
    },
    dot: {
      backgroundColor: colors.surfaceBorder,
      borderRadius: shellRadii.pill,
      height: 4,
      width: 16,
    },
    dotActive: {
      backgroundColor: colors.accentGradientEnd,
      width: 24,
    },
    continuePill: {
      alignItems: 'center',
      backgroundColor: colors.pillBackground,
      borderRadius: shellRadii.pill,
      flexDirection: 'row',
      paddingHorizontal: shellSpacing.sm,
      paddingVertical: shellSpacing.sm,
    },
    continueIconCircle: {
      alignItems: 'center',
      borderRadius: shellRadii.pill,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    continueIconText: {
      color: colors.textOnDark,
      fontSize: 18,
      fontWeight: '700',
    },
    continueLabel: {
      color: colors.textOnDark,
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    continueChevrons: {
      color: colors.textOnDarkMuted,
      fontSize: 16,
      marginRight: shellSpacing.sm,
    },
  });
