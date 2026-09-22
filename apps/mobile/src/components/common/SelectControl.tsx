import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

// Components
import { Typography } from './Typography';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';

interface SelectControlProps {
  isBookingLocked?: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

/** "Select" button / "Selected" label pair shared by flight and hotel option rows. */
export const SelectControl = ({
  isBookingLocked = false,
  isSelected,
  onSelect,
}: SelectControlProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isSelected) {
    return (
      <Typography color="muted" variant="meta" weight="medium">
        Selected
      </Typography>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isBookingLocked}
      onPress={onSelect}
      style={[styles.selectButton, isBookingLocked && styles.selectButtonDisabled]}
    >
      <Typography variant="label" weight="semibold">
        Select
      </Typography>
    </Pressable>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    selectButton: {
      backgroundColor: colors.accentGradientStart,
      borderRadius: shellRadii.pill,
      paddingHorizontal: shellSpacing.sm,
      paddingVertical: shellSpacing.xs,
    },
    selectButtonDisabled: {
      opacity: 0.4,
    },
  });
