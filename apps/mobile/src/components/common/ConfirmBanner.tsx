import { Pressable, StyleSheet, View } from 'react-native';

// Utils
import { shellColors, shellRadii, shellSpacing } from '../../theme';

// Components
import { Card } from './Card';
import { Typography } from './Typography';

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
}: ConfirmBannerProps) => (
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

const styles = StyleSheet.create({
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
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.button,
    borderWidth: 1,
    flex: 1,
    paddingVertical: shellSpacing.sm,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: shellColors.accentGradientStart,
    borderRadius: shellRadii.button,
    flex: 1,
    paddingVertical: shellSpacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
});
