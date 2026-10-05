import { ArrowDown } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';

interface ScrollToLatestButtonProps {
  onPress: () => void;
}

const BUTTON_SIZE = 40;
const ICON_SIZE = 20;

/** Floating button that brings the chat back to its newest message. */
export const ScrollToLatestButton = ({ onPress }: ScrollToLatestButtonProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityLabel="Scroll to latest message"
      accessibilityRole="button"
      hitSlop={shellSpacing.sm}
      onPress={onPress}
      style={styles.button}
      testID="scroll-to-latest"
    >
      <ArrowDown color={colors.textOnDark} size={ICON_SIZE} />
    </Pressable>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.pillBackground,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      bottom: shellSpacing.md,
      height: BUTTON_SIZE,
      justifyContent: 'center',
      position: 'absolute',
      width: BUTTON_SIZE,
    },
  });
