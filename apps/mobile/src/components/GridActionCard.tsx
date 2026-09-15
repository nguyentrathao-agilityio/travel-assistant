import { ArrowRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { shellSpacing, useShellTheme } from '../theme';
import { IconBadge } from './IconBadge';

import type { ShellColors } from '../theme';

interface GridActionCardProps {
  icon: string | LucideIcon;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const GridActionCard = ({ icon, label, onPress, style }: GridActionCardProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, style]}>
      <IconBadge icon={icon} shape="square" size={32} />
      <View style={styles.footerRow}>
        <Text numberOfLines={2} style={styles.label}>
          {label}
        </Text>
        <ArrowRight color={colors.textOnDarkMuted} size={17} />
      </View>
    </Pressable>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: 18,
      borderWidth: 1,
      justifyContent: 'space-between',
      padding: shellSpacing.md,
    },
    footerRow: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: shellSpacing.xs,
      justifyContent: 'space-between',
      marginTop: shellSpacing.sm,
    },
    label: {
      color: colors.textOnDark,
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 18,
    },
  });
