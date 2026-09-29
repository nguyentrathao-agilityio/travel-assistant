import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// Components
import { Card } from './Card';
import { Typography } from './Typography';

// Utils
import { shellOpacity, shellRadii, shellSpacing, useShellTheme } from '../../theme';

// Types
import type { ShellColors } from '../../theme';

interface ConfirmBannerProps {
  title: string;
  description: string;
  price?: string;
  confirmDisabled?: boolean;
  onChangeClick: () => void;
  onConfirmClick: () => void;
}

export const ConfirmBanner = ({
  title,
  description,
  price,
  confirmDisabled = false,
  onChangeClick,
  onConfirmClick,
}: ConfirmBannerProps) => {
  const { colors } = useShellTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <View style={styles.textBlock}>
        <Typography weight="medium">{title}</Typography>
        <Typography color="muted" variant="meta">
          {description}
        </Typography>
        {price && (
          <Typography color="primary" variant="title" weight="semibold">
            {price}
          </Typography>
        )}
      </View>
      <View style={styles.buttonRow}>
        <Pressable accessibilityRole="button" onPress={onChangeClick} style={styles.changeButton}>
          <Typography color="muted" weight="medium">
            Change
          </Typography>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={confirmDisabled}
          onPress={onConfirmClick}
          style={[styles.confirmButton, confirmDisabled && styles.confirmButtonDisabled]}
        >
          <Typography weight="semibold">Confirm</Typography>
        </Pressable>
      </View>
    </Card>
  );
};

const createStyles = (colors: ShellColors) =>
  StyleSheet.create({
    card: {
      gap: shellSpacing.sm,
    },
    textBlock: {
      gap: 2,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: shellSpacing.sm,
    },
    changeButton: {
      alignItems: 'center',
      borderColor: colors.surfaceBorder,
      borderRadius: shellRadii.button,
      borderWidth: 1,
      flex: 1,
      paddingVertical: shellSpacing.sm,
    },
    confirmButton: {
      alignItems: 'center',
      backgroundColor: colors.accentGradientStart,
      borderRadius: shellRadii.button,
      flex: 1,
      paddingVertical: shellSpacing.sm,
    },
    confirmButtonDisabled: {
      opacity: shellOpacity.disabledStrong,
    },
  });
