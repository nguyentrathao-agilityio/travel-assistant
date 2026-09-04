import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { shellColors, shellRadii, shellSpacing } from '../theme';
import { IconBadge } from './IconBadge';

interface PrimaryActionCardProps {
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const PrimaryActionCard = ({
  icon,
  title,
  description,
  buttonLabel,
  onPress,
  style,
}: PrimaryActionCardProps) => (
  <View style={[styles.card, style]}>
    <IconBadge icon={icon} size={40} />
    <View style={styles.body}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
    <Pressable accessibilityRole="button" onPress={onPress}>
      <LinearGradient
        colors={[shellColors.accentGradientStart, shellColors.accentGradientEnd]}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0 }}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>{buttonLabel}</Text>
      </LinearGradient>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.card,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'space-between',
    padding: shellSpacing.md,
  },
  body: {
    marginVertical: shellSpacing.md,
  },
  title: {
    color: shellColors.textOnDark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: shellSpacing.xs,
  },
  description: {
    color: shellColors.textOnDarkFaint,
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    alignItems: 'center',
    borderRadius: shellRadii.button,
    paddingVertical: shellSpacing.sm + 2,
  },
  buttonLabel: {
    color: shellColors.textOnDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
