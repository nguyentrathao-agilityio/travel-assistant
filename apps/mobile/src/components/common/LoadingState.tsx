import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { shellColors, shellRadii, shellSpacing } from '../../theme';
import { Card } from './Card';

interface LoadingStateProps {
  lines?: number;
}

const SkeletonLine = ({ width, opacity }: { width: `${number}%`; opacity: Animated.Value }) => (
  <Animated.View style={[styles.line, { width, opacity }]} />
);

export const LoadingState = ({ lines = 3 }: LoadingStateProps) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <Card>
      <View
        accessibilityLabel="Loading"
        accessibilityRole="progressbar"
        importantForAccessibility="yes"
        style={styles.container}
      >
        <SkeletonLine opacity={opacity} width="50%" />
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLine
            key={index}
            opacity={opacity}
            width={index === lines - 1 ? '75%' : '100%'}
          />
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: shellSpacing.sm,
  },
  line: {
    backgroundColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.button,
    height: 10,
  },
});
