import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useShellTheme } from '../theme';

import type { ShellColors } from '../theme';

interface IconBadgeProps {
  icon: string | LucideIcon;
  shape?: 'circle' | 'square';
  size?: number;
}

export const IconBadge = ({ icon, shape = 'circle', size = 36 }: IconBadgeProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const borderRadius = shape === 'circle' ? size / 2 : size / 3;
  const Icon = typeof icon === 'string' ? null : icon;

  return (
    <View style={[styles.badge, { borderRadius, height: size, width: size }]}>
      {Icon ? (
        <Icon color={colors.textOnDarkMuted} size={size * 0.48} strokeWidth={2.2} />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{icon as string}</Text>
      )}
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    badge: {
      alignItems: 'center',
      backgroundColor: colors.iconBadgeBackground,
      justifyContent: 'center',
    },
  });
