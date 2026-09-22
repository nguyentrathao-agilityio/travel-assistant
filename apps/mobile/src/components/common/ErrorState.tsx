import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// Components
import { Card } from './Card';

// Utils
import { shellRadii, shellSpacing, useShellTheme } from '../../theme';
import { Typography } from './Typography';

// Types
import type { ShellColors } from '../../theme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
  retryLabel = 'Retry',
}: ErrorStateProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card>
      <View accessibilityRole="alert" style={styles.row}>
        <Typography color="danger">⚠️</Typography>
        <Typography color="muted" style={styles.message}>
          {message}
        </Typography>
      </View>
      {onRetry && (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        >
          <Typography weight="semibold">{retryLabel}</Typography>
        </Pressable>
      )}
    </Card>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: shellSpacing.sm,
    },
    message: {
      flex: 1,
    },
    retryButton: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      borderWidth: 1,
      marginTop: shellSpacing.sm,
      paddingHorizontal: shellSpacing.md,
      paddingVertical: shellSpacing.xs,
    },
    retryButtonPressed: {
      opacity: 0.6,
    },
  });
