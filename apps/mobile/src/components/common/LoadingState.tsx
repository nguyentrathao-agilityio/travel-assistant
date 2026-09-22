import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Components
import { Card } from './Card';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';

interface LoadingStateProps {
  lines?: number;
}

const SkeletonLine = ({ width, opacity }: { width: `${number}%`; opacity: Animated.Value }) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <Animated.View style={[styles.line, { width, opacity }]} />;
};

export const LoadingState = ({ lines = 3 }: LoadingStateProps) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    container: {
      gap: shellSpacing.sm,
    },
    line: {
      backgroundColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      height: 10,
    },
  });
