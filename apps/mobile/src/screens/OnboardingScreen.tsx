import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, ChevronsRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

// Constants
import { ONBOARDING_SLIDES } from '../constants';

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
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = ONBOARDING_SLIDES[activeSlide];
  const isLastSlide = activeSlide === ONBOARDING_SLIDES.length - 1;

  const handleBack = () => {
    if (activeSlide > 0) setActiveSlide(activeSlide - 1);
  };

  const handleContinue = () => {
    if (isLastSlide) {
      onContinue();
      return;
    }

    setActiveSlide(activeSlide + 1);
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      end={{ x: 0.9, y: 0 }}
      start={{ x: 0.1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.brandRow}>
        <Text style={styles.brandName}>Travel Assistant</Text>
      </View>

      <View style={styles.illustrationArea}>
        <View style={styles.speechBubbleGroup}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechBubbleText}>{slide.bubble}</Text>
          </View>
          <View style={styles.speechBubbleTail}>
            <View style={[styles.tailDot, styles.tailDotLarge]} />
            <View style={[styles.tailDot, styles.tailDotMedium]} />
            <View style={[styles.tailDot, styles.tailDotSmall]} />
          </View>
        </View>

        <Image
          resizeMode="contain"
          source={require('../../assets/onboarding-robot.png')}
          style={styles.illustrationImage}
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.headline}>
          {slide.headlinePrefix} <Text style={styles.headlineAccent}>{slide.headlineAccent}</Text>
        </Text>
        <Text style={styles.subcopy}>{slide.subcopy}</Text>

        <View style={styles.pagination}>
          {ONBOARDING_SLIDES.map((item, index) => (
            <View
              key={item.headlineAccent}
              style={[styles.dot, index === activeSlide && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      <View style={styles.bottomRow}>
        {activeSlide > 0 && (
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={handleBack}
            style={styles.backCircle}
          >
            <ArrowLeft color={colors.textOnDark} size={18} />
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={handleContinue} style={styles.continuePill}>
          <LinearGradient
            colors={[colors.accentGradientStart, colors.accentGradientEnd]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.continueIconCircle}
          >
            <ArrowRight color={colors.textOnDark} size={18} />
          </LinearGradient>
          <Text style={styles.continueLabel}>{isLastSlide ? 'Get Started' : 'Continue'}</Text>
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
    speechBubbleGroup: {
      alignItems: 'flex-end',
      alignSelf: 'stretch',
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
      alignItems: 'flex-end',
      gap: 4,
      marginVertical: shellSpacing.sm,
    },
    tailDot: {
      backgroundColor: colors.surface,
      borderRadius: shellRadii.pill,
    },
    tailDotLarge: {
      height: 10,
      marginRight: 28,
      width: 10,
    },
    tailDotMedium: {
      height: 7,
      marginRight: 44,
      width: 7,
    },
    tailDotSmall: {
      height: 4,
      marginRight: 60,
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
    continueChevrons: {
      marginRight: shellSpacing.sm,
    },
  });
