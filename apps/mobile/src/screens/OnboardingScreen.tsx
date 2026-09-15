import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, ChevronsRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

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
      end={{ x: 0.9, y: 0 }}
      start={{ x: 0.1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.brandRow}>
        <Text style={styles.brandMark}>◔</Text>
        <Text style={styles.brandName}>Chattie Travel</Text>
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

        <Image
          resizeMode="contain"
          source={require('../../assets/onboarding-robot.png')}
          style={styles.illustrationImage}
        />
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

      <View style={styles.bottomRow}>
        <View importantForAccessibility="no-hide-descendants" style={styles.backCircle}>
          <ArrowLeft color={colors.textOnDark} size={20} />
        </View>
        <Pressable accessibilityRole="button" onPress={onContinue} style={styles.continuePill}>
          <LinearGradient
            colors={[colors.accentGradientStart, colors.accentGradientEnd]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.continueIconCircle}
          >
            <ArrowRight color={colors.textOnDark} size={18} />
          </LinearGradient>
          <Text style={styles.continueLabel}>Continue</Text>
          <ChevronsRight color={colors.textOnDarkMuted} size={16} style={styles.continueChevrons} />
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const createStyles = (colors: ShellColors) =>
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
      paddingTop: shellSpacing.md,
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
    illustrationImage: {
      height: 270,
      marginTop: shellSpacing.xs,
      width: 290,
    },
    textBlock: {
      marginBottom: shellSpacing.lg,
    },
    headline: {
      color: colors.textOnDark,
      fontSize: 27,
      fontWeight: '500',
      lineHeight: 36,
    },
    headlineAccent: {
      color: colors.accentGradientEnd,
      fontWeight: '700',
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
    bottomRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.sm,
    },
    backCircle: {
      alignItems: 'center',
      backgroundColor: colors.pillBackground,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: shellRadii.pill,
      height: 56,
      justifyContent: 'center',
      width: 56,
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
    continueChevrons: {
      marginRight: shellSpacing.sm,
    },
  });
