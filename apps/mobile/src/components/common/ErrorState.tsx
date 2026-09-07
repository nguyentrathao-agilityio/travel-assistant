import { StyleSheet, View } from 'react-native';

import { shellSpacing } from '../../theme';
import { Card } from './Card';
import { Typography } from './Typography';

interface ErrorStateProps {
  message?: string;
}

export const ErrorState = ({
  message = 'Something went wrong. Please try again.',
}: ErrorStateProps) => (
  <Card>
    <View accessibilityRole="alert" style={styles.row}>
      <Typography color="danger">⚠️</Typography>
      <Typography color="muted" style={styles.message}>
        {message}
      </Typography>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: shellSpacing.sm,
  },
  message: {
    flex: 1,
  },
});
