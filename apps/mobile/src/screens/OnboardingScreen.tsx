import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, ChevronsRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

// Constants
import { ONBOARDING_SLIDES } from '../constants';

// Utils
import { useShellTheme } from '../theme';
import { createOnboardingScreenStyles } from './OnboardingScreen.styles';

interface OnboardingScreenProps {
  onContinue: () => void;
}

export const OnboardingScreen = ({ onContinue }: OnboardingScreenProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createOnboardingScreenStyles(colors), [colors]);
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
