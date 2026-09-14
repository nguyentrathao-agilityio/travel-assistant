import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { shellRadii, shellSpacing, useShellTheme } from '../theme';
import { IconBadge } from './IconBadge';

import type { ShellColors } from '../theme';

interface GridActionCardProps {
  icon: string;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const GridActionCard = ({ icon, label, onPress, style }: GridActionCardProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <IconBadge icon={icon} size={32} />
        <Text style={styles.chevron}>›</Text>
      </View>
      <Text numberOfLines={2} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.card,
      borderWidth: 1,
      justifyContent: 'space-between',
      padding: shellSpacing.md,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: shellSpacing.sm,
    },
    chevron: {
      color: colors.textOnDarkMuted,
      fontSize: 20,
      fontWeight: '300',
    },
    label: {
      color: colors.textOnDark,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
    },
  });
