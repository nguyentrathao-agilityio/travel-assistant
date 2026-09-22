import { Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

// Constants
import { HEADER_ICON_SIZE } from '../../constants';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';

export const ThemeToggleButton = () => {
  const { theme, setTheme, colors } = useShellTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityLabel="Toggle theme"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      style={styles.button}
    >
      {theme === 'dark' ? (
        <Sun color={colors.textOnDark} size={HEADER_ICON_SIZE} />
      ) : (
        <Moon color={colors.textOnDark} size={HEADER_ICON_SIZE} />
      )}
    </Pressable>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: shellRadii.pill,
      height: 36,
      justifyContent: 'center',
      marginRight: shellSpacing.xs,
      width: 36,
    },
  });
