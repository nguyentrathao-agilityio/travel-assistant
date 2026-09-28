import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

// Utils
import { shellSpacing, useShellTheme } from '../theme';

// Types
import type { Suggestion } from '@copilotkit/react-native/headless';
import type { ShellColors } from '../theme';

interface SuggestionChipsProps {
  disabled?: boolean;
  suggestions: readonly Suggestion[];
  onSelect: (message: string) => void;
}

// Follow-up suggestion chips from useChatSuggestions — not a hardcoded list.
export const SuggestionChips = ({
  disabled = false,
  suggestions,
  onSelect,
}: SuggestionChipsProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
    >
      {suggestions.map(({ isLoading, message, title }, index) => (
        <Pressable
          accessibilityRole="button"
          disabled={disabled || isLoading}
          key={index}
          onPress={() => onSelect(message)}
          style={[styles.chip, (disabled || isLoading) && styles.chipDisabled]}
        >
          {isLoading && <ActivityIndicator color={colors.textOnDarkMuted} size="small" />}
          <Text style={styles.chipLabel}>{title}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    scrollView: {
      marginTop: shellSpacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: shellSpacing.sm,
      paddingLeft: shellSpacing.lg,
    },
    chip: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      gap: shellSpacing.xs,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    chipDisabled: {
      opacity: 0.5,
    },
    chipLabel: {
      color: colors.textOnDark,
      fontSize: 12,
      fontWeight: '600',
    },
  });
