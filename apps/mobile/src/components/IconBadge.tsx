import { StyleSheet, Text, View } from 'react-native';

import { shellColors } from '../theme';

interface IconBadgeProps {
  icon: string;
  size?: number;
}

export const IconBadge = ({ icon, size = 36 }: IconBadgeProps) => (
  <View style={[styles.badge, { borderRadius: size / 2, height: size, width: size }]}>
    <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: shellColors.iconBadgeBackground,
    justifyContent: 'center',
  },
});
