import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { shellColors, shellRadii, shellSpacing } from '../theme';
import { IconBadge } from './IconBadge';

interface GridActionCardProps {
  icon: string;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const GridActionCard = ({ icon, label, onPress, style }: GridActionCardProps) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, style]}>
    <View style={styles.headerRow}>
      <IconBadge icon={icon} size={32} />
      <Text style={styles.chevron}>›</Text>
    </View>
    <Text numberOfLines={2} style={styles.label}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: shellColors.surface,
    borderColor: shellColors.surfaceBorder,
    borderRadius: shellRadii.card,
    borderWidth: 1,
    justifyContent: 'space-between',
    padding: shellSpacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: shellSpacing.sm,
  },
  chevron: {
    color: shellColors.textOnDarkMuted,
    fontSize: 20,
    fontWeight: '300',
  },
  label: {
    color: shellColors.textOnDark,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
});
