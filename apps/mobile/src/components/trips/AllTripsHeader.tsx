import { Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Components
import { HeaderBackButton, ThemeToggleButton } from '../common';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';

interface AllTripsHeaderProps {
  isDeletingAll: boolean;
  onBack: () => void;
  onDeleteAll: () => void;
  topInset: number;
}

export const AllTripsHeader = ({
  isDeletingAll,
  onBack,
  onDeleteAll,
  topInset,
}: AllTripsHeaderProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.row, { paddingTop: topInset + shellSpacing.md }]}>
      <HeaderBackButton onPress={onBack} />
      <Text style={styles.title}>All trips</Text>
      <View style={styles.spacer} />
      <Pressable
        accessibilityLabel="Delete all trips"
        accessibilityRole="button"
        disabled={isDeletingAll}
        hitSlop={8}
        onPress={onDeleteAll}
        style={[styles.deleteAllButton, isDeletingAll && styles.disabled]}
      >
        <Trash2 color={colors.textOnDark} size={18} />
      </Pressable>
      <ThemeToggleButton />
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.sm,
      paddingBottom: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
    },
    title: { color: colors.textOnDark, fontSize: 18, fontWeight: '700' },
    spacer: { flex: 1 },
    deleteAllButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: shellRadii.pill,
      height: 36,
      justifyContent: 'center',
      marginRight: shellSpacing.xs,
      width: 36,
    },
    disabled: { opacity: 0.4 },
  });
