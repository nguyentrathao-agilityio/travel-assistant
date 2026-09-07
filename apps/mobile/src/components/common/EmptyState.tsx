import { StyleSheet, View } from 'react-native';

import { shellSpacing } from '../../theme';
import { Typography } from './Typography';

interface EmptyStateProps {
  icon?: string;
  message: string;
}

export const EmptyState = ({ icon, message }: EmptyStateProps) => (
  <View style={styles.container}>
    {icon && <Typography style={styles.icon}>{icon}</Typography>}
    <Typography color="muted">{message}</Typography>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: shellSpacing.xs,
    paddingVertical: shellSpacing.lg,
  },
  icon: {
    fontSize: 24,
  },
});
