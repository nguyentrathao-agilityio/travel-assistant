import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useShellTheme } from '../theme';

import type { ShellColors } from '../theme';

interface IconBadgeProps {
  icon: string;
  size?: number;
}

export const IconBadge = ({ icon, size = 36 }: IconBadgeProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.badge, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
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
