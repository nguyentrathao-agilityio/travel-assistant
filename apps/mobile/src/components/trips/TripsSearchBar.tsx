import { Search } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { shellRadii, shellSpacing, useShellTheme } from '../../theme';

import type { ShellColors } from '../../theme';

interface TripsSearchBarProps {
  onChangeQuery: (query: string) => void;
  onFocusChange: (focused: boolean) => void;
  query: string;
}

export const TripsSearchBar = ({ onChangeQuery, onFocusChange, query }: TripsSearchBarProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.searchBar}>
      <Search color={colors.textOnDarkMuted} size={18} />
      <TextInput
        onBlur={() => onFocusChange(false)}
        onChangeText={onChangeQuery}
        onFocus={() => onFocusChange(true)}
        placeholder="Search your trips"
        placeholderTextColor={colors.textOnDarkMuted}
        returnKeyType="search"
        style={styles.searchInput}
        value={query}
      />
    </View>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    searchBar: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.pill,
      borderWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.sm,
      height: 48,
      marginHorizontal: shellSpacing.lg,
      marginTop: shellSpacing.lg,
      paddingHorizontal: shellSpacing.md,
    },
    searchInput: { color: colors.textOnDark, flex: 1, fontSize: 15 },
  });
