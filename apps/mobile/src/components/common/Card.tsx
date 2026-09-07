import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { shellColors, shellRadii, shellSpacing } from '../../theme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card = ({ children, onPress, style }: CardProps) => {
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, style]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.card,
    borderWidth: 1,
    padding: shellSpacing.md,
  },
});
