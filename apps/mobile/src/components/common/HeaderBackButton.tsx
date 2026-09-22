import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

// Utils
import { useShellTheme } from '../../theme';

interface HeaderBackButtonProps {
  onPress: () => void;
}

export const HeaderBackButton = ({ onPress }: HeaderBackButtonProps) => {
  const { colors } = useShellTheme();

  return (
    <Pressable
      accessibilityLabel="Back"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={styles.button}
    >
      <ArrowLeft color={colors.textOnDark} size={22} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
