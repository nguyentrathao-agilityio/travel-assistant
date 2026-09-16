import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { IconBadge } from './IconBadge';

import type { ShellColors } from '../theme';

interface PrimaryActionCardProps {
  disabled?: boolean;
  icon: string | LucideIcon;
  title?: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const PrimaryActionCard = ({
  disabled = false,
  icon,
  title,
  description,
  buttonLabel,
  onPress,
  style,
}: PrimaryActionCardProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]}>
      <IconBadge icon={icon} shape="square" size={40} />
      <View style={styles.body}>
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <View accessibilityLabel="Voice waveform" style={styles.waveform}>
            {[12, 24, 42, 28, 14].map((height, index) => (
              <LinearGradient
                colors={[colors.accentGradientStart, colors.accentGradientEnd]}
                key={height}
                style={[styles.waveformBar, { height }, index === 2 && styles.waveformBarWide]}
              />
            ))}
          </View>
        )}
        <Text style={styles.description}>{description}</Text>
      </View>
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
        <LinearGradient
          colors={[colors.accentGradientStart, colors.accentGradientEnd]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={[styles.button, disabled && styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>{buttonLabel}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'space-between',
      padding: shellSpacing.md,
    },
    body: {
      flex: 1,
      justifyContent: 'flex-end',
      marginVertical: shellSpacing.md,
    },
    title: {
      color: colors.textOnDark,
      fontSize: 17,
      fontWeight: '600',
      marginBottom: shellSpacing.xs,
    },
    description: {
      color: colors.textOnDarkMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    waveform: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      justifyContent: 'center',
      marginBottom: shellSpacing.xl,
    },
    waveformBar: {
      borderRadius: shellRadii.pill,
      width: 8,
    },
    waveformBarWide: {
      width: 10,
    },
    button: {
      alignItems: 'center',
      borderRadius: shellRadii.pill,
      paddingVertical: shellSpacing.sm + 2,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonLabel: {
      color: colors.textOnDark,
      fontSize: 14,
      fontWeight: '700',
    },
  });
